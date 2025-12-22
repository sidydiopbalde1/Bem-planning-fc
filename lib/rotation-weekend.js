// lib/rotation-weekend.js - Algorithme d'attribution automatique des rotations weekend

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Algorithme d'attribution équitable des rotations weekend
 * Basé sur le nombre de weekends déjà supervisés
 */
export class RotationWeekendManager {

  /**
   * Génère les rotations pour les N prochaines semaines
   * @param {number} nbSemaines - Nombre de semaines à planifier
   * @param {string[]} responsableIds - IDs des responsables éligibles
   * @param {Date} dateDebut - Date de début de planification
   * @returns {Promise<object[]>} Rotations créées
   */
  static async genererRotations(nbSemaines, responsableIds, dateDebut = new Date()) {
    try {
      const rotations = [];
      let currentDate = this.getProchainSamedi(dateDebut);

      // Récupérer les statistiques de chaque responsable
      const stats = await this.getStatistiquesResponsables(responsableIds);

      for (let i = 0; i < nbSemaines; i++) {
        const weekend = this.getWeekendDates(currentDate);

        // Trouver le responsable le plus équitable
        const responsable = await this.selectionnerResponsable(
          responsableIds,
          stats,
          weekend.dateDebut,
          weekend.dateFin
        );

        if (!responsable) {
          console.warn(`Aucun responsable disponible pour ${weekend.dateDebut.toLocaleDateString()}`);
          currentDate = this.addWeeks(currentDate, 1);
          continue;
        }

        // Compter les séances prévues ce weekend
        const nbSeances = await this.compterSeancesWeekend(weekend.dateDebut, weekend.dateFin);

        // Créer la rotation
        const rotation = await prisma.rotationWeekend.create({
          data: {
            dateDebut: weekend.dateDebut,
            dateFin: weekend.dateFin,
            semaineNumero: weekend.semaineNumero,
            annee: weekend.annee,
            responsableId: responsable.id,
            nbSeancesTotal: nbSeances,
            status: 'PLANIFIE'
          },
          include: {
            responsable: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        rotations.push(rotation);

        // Mettre à jour les stats locales pour le prochain tour
        const statResponsable = stats.find(s => s.responsableId === responsable.id);
        if (statResponsable) {
          statResponsable.nbWeekendTotal++;
        }

        // Avancer d'une semaine
        currentDate = this.addWeeks(currentDate, 1);
      }

      console.log(`${rotations.length} rotations générées avec succès`);
      return rotations;

    } catch (error) {
      console.error('Erreur lors de la génération des rotations:', error);
      throw error;
    }
  }

  /**
   * Sélectionne le responsable le plus équitable pour un weekend donné
   * Critères: 1) Disponibilité, 2) Nombre de weekends minimal
   */
  static async selectionnerResponsable(responsableIds, stats, dateDebut, dateFin) {
    // Vérifier les disponibilités
    const disponibilites = await prisma.disponibiliteResponsable.findMany({
      where: {
        responsableId: { in: responsableIds },
        dateDebut: { lte: dateFin },
        dateFin: { gte: dateDebut },
        disponible: false
      }
    });

    const responsablesIndisponibles = new Set(disponibilites.map(d => d.responsableId));

    // Filtrer les responsables disponibles
    const responsablesDisponibles = stats.filter(
      s => !responsablesIndisponibles.has(s.responsableId)
    );

    if (responsablesDisponibles.length === 0) {
      return null;
    }

    // Trier par nombre de weekends (équité)
    responsablesDisponibles.sort((a, b) => a.nbWeekendTotal - b.nbWeekendTotal);

    // Retourner le responsable avec le moins de weekends
    const choisi = responsablesDisponibles[0];

    return await prisma.user.findUnique({
      where: { id: choisi.responsableId }
    });
  }

  /**
   * Récupère les statistiques des responsables pour l'année en cours
   */
  static async getStatistiquesResponsables(responsableIds) {
    const anneeEnCours = new Date().getFullYear();

    const stats = await Promise.all(
      responsableIds.map(async (responsableId) => {
        // Compter les weekends déjà assignés cette année
        const nbWeekendTotal = await prisma.rotationWeekend.count({
          where: {
            responsableId,
            annee: anneeEnCours,
            status: { notIn: ['ANNULE'] }
          }
        });

        return {
          responsableId,
          nbWeekendTotal,
          nbWeekendRealises: 0, // À implémenter
          tauxPresence: 100
        };
      })
    );

    return stats;
  }

  /**
   * Compte le nombre de séances prévues pendant un weekend
   */
  static async compterSeancesWeekend(dateDebut, dateFin) {
    const count = await prisma.seance.count({
      where: {
        dateSeance: {
          gte: dateDebut,
          lte: dateFin
        },
        status: { notIn: ['ANNULE'] }
      }
    });

    return count;
  }

  /**
   * Gère le remplacement automatique en cas d'absence
   */
  static async gererRemplacement(rotationId, raisonAbsence) {
    try {
      const rotation = await prisma.rotationWeekend.findUnique({
        where: { id: rotationId },
        include: { responsable: true }
      });

      if (!rotation) {
        throw new Error('Rotation introuvable');
      }

      // Récupérer tous les responsables COORDINATOR
      const responsables = await prisma.user.findMany({
        where: {
          role: 'COORDINATOR',
          id: { not: rotation.responsableId } // Exclure le responsable absent
        },
        select: { id: true }
      });

      const responsableIds = responsables.map(r => r.id);

      if (responsableIds.length === 0) {
        throw new Error('Aucun responsable disponible pour le remplacement');
      }

      // Obtenir les stats
      const stats = await this.getStatistiquesResponsables(responsableIds);

      // Sélectionner le remplaçant
      const remplacant = await this.selectionnerResponsable(
        responsableIds,
        stats,
        rotation.dateDebut,
        rotation.dateFin
      );

      if (!remplacant) {
        throw new Error('Aucun remplaçant disponible');
      }

      // Créer une nouvelle rotation pour le remplaçant
      const nouvelleRotation = await prisma.rotationWeekend.create({
        data: {
          dateDebut: rotation.dateDebut,
          dateFin: rotation.dateFin,
          semaineNumero: rotation.semaineNumero,
          annee: rotation.annee,
          responsableId: remplacant.id,
          substitutId: rotation.responsableId,
          nbSeancesTotal: rotation.nbSeancesTotal,
          status: 'CONFIRME',
          estAbsence: true,
          commentaire: `Remplacement de ${rotation.responsable.name} - Raison: ${raisonAbsence}`
        },
        include: {
          responsable: true,
          substitut: true
        }
      });

      // Marquer l'ancienne rotation comme ABSENT
      await prisma.rotationWeekend.update({
        where: { id: rotationId },
        data: {
          status: 'ABSENT',
          commentaire: raisonAbsence
        }
      });

      console.log(`Remplacement effectué: ${remplacant.name} remplace ${rotation.responsable.name}`);

      return nouvelleRotation;

    } catch (error) {
      console.error('Erreur lors du remplacement:', error);
      throw error;
    }
  }

  /**
   * Déclare une indisponibilité pour un responsable
   */
  static async declarerIndisponibilite(responsableId, dateDebut, dateFin, raison) {
    return await prisma.disponibiliteResponsable.create({
      data: {
        responsableId,
        dateDebut,
        dateFin,
        disponible: false,
        raison
      }
    });
  }

  /**
   * Marque une rotation comme terminée et calcule les statistiques
   */
  static async terminerRotation(rotationId, rapportData = {}) {
    try {
      // Marquer la rotation comme terminée
      const rotation = await prisma.rotationWeekend.update({
        where: { id: rotationId },
        data: {
          status: rapportData ? 'TERMINE' : 'TERMINE_SANS_RAPPORT',
          nbSeancesRealisees: rapportData.nbSeancesVisitees || 0
        },
        include: { responsable: true }
      });

      // Créer le rapport si fourni
      if (rapportData && Object.keys(rapportData).length > 0) {
        await prisma.rapportSupervision.create({
          data: {
            rotationId,
            ...rapportData
          }
        });
      }

      // Mettre à jour les statistiques du responsable
      await this.mettreAJourStatistiques(rotation.responsableId, rotation.annee);

      return rotation;

    } catch (error) {
      console.error('Erreur lors de la clôture de la rotation:', error);
      throw error;
    }
  }

  /**
   * Met à jour les statistiques d'un responsable pour une année donnée
   */
  static async mettreAJourStatistiques(responsableId, annee) {
    const rotations = await prisma.rotationWeekend.findMany({
      where: {
        responsableId,
        annee,
        status: { notIn: ['ANNULE'] }
      },
      include: {
        rapportSupervision: true
      }
    });

    const nbWeekendTotal = rotations.length;
    const nbWeekendRealises = rotations.filter(r =>
      r.status === 'TERMINE' || r.status === 'TERMINE_SANS_RAPPORT'
    ).length;
    const nbWeekendAbsences = rotations.filter(r => r.status === 'ABSENT').length;
    const tauxPresence = nbWeekendTotal > 0
      ? ((nbWeekendRealises / nbWeekendTotal) * 100).toFixed(2)
      : 0;

    const nbSeancesTotal = rotations.reduce((sum, r) => sum + r.nbSeancesTotal, 0);

    const satisfactions = rotations
      .filter(r => r.rapportSupervision?.satisfaction)
      .map(r => r.rapportSupervision.satisfaction);

    const moyenneSatisfaction = satisfactions.length > 0
      ? satisfactions.reduce((sum, s) => sum + s, 0) / satisfactions.length
      : null;

    // Upsert statistiques
    await prisma.statistiqueRotation.upsert({
      where: {
        responsableId_annee_mois: {
          responsableId,
          annee,
          mois: null
        }
      },
      create: {
        responsableId,
        annee,
        nbWeekendTotal,
        nbWeekendRealises,
        nbWeekendAbsences,
        tauxPresence: parseFloat(tauxPresence),
        nbSeancesTotal,
        moyenneSatisfaction
      },
      update: {
        nbWeekendTotal,
        nbWeekendRealises,
        nbWeekendAbsences,
        tauxPresence: parseFloat(tauxPresence),
        nbSeancesTotal,
        moyenneSatisfaction
      }
    });
  }

  // ==================== UTILITAIRES ====================

  /**
   * Retourne le prochain samedi à partir d'une date
   */
  static getProchainSamedi(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 6 ? 0 : (6 - day + 7) % 7;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Retourne les dates de début et fin d'un weekend
   */
  static getWeekendDates(samedi) {
    const dateDebut = new Date(samedi);
    dateDebut.setHours(0, 0, 0, 0);

    const dateFin = new Date(samedi);
    dateFin.setDate(dateFin.getDate() + 1); // Dimanche
    dateFin.setHours(23, 59, 59, 999);

    // Numéro de semaine ISO 8601
    const semaineNumero = this.getWeekNumber(dateDebut);
    const annee = dateDebut.getFullYear();

    return { dateDebut, dateFin, semaineNumero, annee };
  }

  /**
   * Calcule le numéro de semaine ISO 8601
   */
  static getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Ajoute N semaines à une date
   */
  static addWeeks(date, weeks) {
    const result = new Date(date);
    result.setDate(result.getDate() + (weeks * 7));
    return result;
  }
}

export default RotationWeekendManager;
