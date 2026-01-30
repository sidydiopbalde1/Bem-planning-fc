// pages/api/admin/stats/intervenants.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    return await handleGet(req, res);
  } catch (error) {
    console.error('Erreur API stats intervenants:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res) {
  const { dateDebut, dateFin } = req.query;

  const endDate = dateFin ? new Date(dateFin) : new Date();
  const startDate = dateDebut ? new Date(dateDebut) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Statistiques générales
  const [totalIntervenants, intervenantsActifs, intervenants] = await Promise.all([
    prisma.intervenant.count(),
    prisma.intervenant.count({ where: { disponible: true } }),
    prisma.intervenant.findMany({
      include: {
        modules: true,
        seances: {
          where: {
            dateSeance: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })
  ]);

  // Analyse de charge par intervenant
  const chargeParIntervenant = await Promise.all(
    intervenants.map(async (intervenant) => {
      const seances = intervenant.seances;

      // Grouper par type de séance
      const seancesParType = {
        CM: seances.filter(s => s.typeSeance === 'CM'),
        TD: seances.filter(s => s.typeSeance === 'TD'),
        TP: seances.filter(s => s.typeSeance === 'TP'),
        EXAMEN: seances.filter(s => s.typeSeance === 'EXAMEN'),
        RATTRAPAGE: seances.filter(s => s.typeSeance === 'RATTRAPAGE')
      };

      const heuresParType = {
        CM: seancesParType.CM.reduce((sum, s) => sum + (s.duree || 0), 0),
        TD: seancesParType.TD.reduce((sum, s) => sum + (s.duree || 0), 0),
        TP: seancesParType.TP.reduce((sum, s) => sum + (s.duree || 0), 0),
        EXAMEN: seancesParType.EXAMEN.reduce((sum, s) => sum + (s.duree || 0), 0),
        RATTRAPAGE: seancesParType.RATTRAPAGE.reduce((sum, s) => sum + (s.duree || 0), 0)
      };

      const totalHeures = Object.values(heuresParType).reduce((sum, h) => sum + h, 0);

      // Calculer les heures par jour et par semaine
      const seancesParDate = {};
      seances.forEach(seance => {
        const date = new Date(seance.dateSeance).toDateString();
        if (!seancesParDate[date]) {
          seancesParDate[date] = [];
        }
        seancesParDate[date].push(seance);
      });

      const heuresParJour = Object.entries(seancesParDate).map(([date, seances]) => ({
        date,
        heures: seances.reduce((sum, s) => sum + (s.duree || 0), 0)
      }));

      const maxHeuresJour = heuresParJour.length > 0
        ? Math.max(...heuresParJour.map(j => j.heures))
        : 0;

      // Calculer les heures par semaine
      const seancesParSemaine = {};
      seances.forEach(seance => {
        const date = new Date(seance.dateSeance);
        const weekKey = getWeekNumber(date);
        if (!seancesParSemaine[weekKey]) {
          seancesParSemaine[weekKey] = [];
        }
        seancesParSemaine[weekKey].push(seance);
      });

      const heuresParSemaine = Object.entries(seancesParSemaine).map(([week, seances]) => ({
        semaine: week,
        heures: seances.reduce((sum, s) => sum + (s.duree || 0), 0)
      }));

      const maxHeuresSemaine = heuresParSemaine.length > 0
        ? Math.max(...heuresParSemaine.map(s => s.heures))
        : 0;

      // Vérifier les contraintes
      const depasseMaxJour = maxHeuresJour > (intervenant.heuresMaxJour || 6);
      const depasseMaxSemaine = maxHeuresSemaine > (intervenant.heuresMaxSemaine || 20);

      // Calculer le taux de charge (basé sur 20h/semaine max)
      const nbSemaines = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
      const heuresMaxPeriode = (intervenant.heuresMaxSemaine || 20) * nbSemaines;
      const tauxCharge = heuresMaxPeriode > 0
        ? Math.round((totalHeures / heuresMaxPeriode) * 100)
        : 0;

      return {
        id: intervenant.id,
        nom: `${intervenant.prenom} ${intervenant.nom}`,
        email: intervenant.email,
        grade: intervenant.grade,
        specialite: intervenant.specialite,
        nombreModules: intervenant.modules.length,
        nombreSeances: seances.length,
        heuresParType,
        totalHeures,
        heuresMaxJour: intervenant.heuresMaxJour,
        heuresMaxSemaine: intervenant.heuresMaxSemaine,
        maxHeuresJour,
        maxHeuresSemaine,
        depasseMaxJour,
        depasseMaxSemaine,
        tauxCharge,
        alertes: {
          surcharge: depasseMaxJour || depasseMaxSemaine,
          sousUtilise: tauxCharge < 30
        }
      };
    })
  );

  // Top 10 intervenants les plus chargés
  const top10Charges = chargeParIntervenant
    .sort((a, b) => b.totalHeures - a.totalHeures)
    .slice(0, 10);

  // Intervenants en surcharge
  const intervenantsSurcharge = chargeParIntervenant.filter(i =>
    i.depasseMaxJour || i.depasseMaxSemaine
  );

  // Intervenants sous-utilisés
  const intervenantsSousUtilises = chargeParIntervenant.filter(i =>
    i.tauxCharge < 30 && i.nombreSeances > 0
  );

  // Répartition par type de séance (global)
  const totalHeuresParType = {
    CM: chargeParIntervenant.reduce((sum, i) => sum + i.heuresParType.CM, 0),
    TD: chargeParIntervenant.reduce((sum, i) => sum + i.heuresParType.TD, 0),
    TP: chargeParIntervenant.reduce((sum, i) => sum + i.heuresParType.TP, 0),
    EXAMEN: chargeParIntervenant.reduce((sum, i) => sum + i.heuresParType.EXAMEN, 0),
    RATTRAPAGE: chargeParIntervenant.reduce((sum, i) => sum + i.heuresParType.RATTRAPAGE, 0)
  };

  // Statistiques par spécialité
  const specialites = [...new Set(intervenants.map(i => i.specialite).filter(Boolean))];
  const statsParSpecialite = specialites.map(specialite => {
    const intervenantsSpec = chargeParIntervenant.filter(i => i.specialite === specialite);
    const totalHeuresSpec = intervenantsSpec.reduce((sum, i) => sum + i.totalHeures, 0);
    const moyenneHeures = intervenantsSpec.length > 0
      ? Math.round(totalHeuresSpec / intervenantsSpec.length)
      : 0;

    return {
      specialite,
      nombreIntervenants: intervenantsSpec.length,
      totalHeures: totalHeuresSpec,
      moyenneHeures
    };
  });

  // Taux de charge moyen
  const tauxChargeMoyen = chargeParIntervenant.length > 0
    ? Math.round(
        chargeParIntervenant.reduce((sum, i) => sum + i.tauxCharge, 0) /
        chargeParIntervenant.length
      )
    : 0;

  return res.status(200).json({
    periode: {
      debut: startDate,
      fin: endDate
    },
    general: {
      totalIntervenants,
      intervenantsActifs,
      intervenantsInactifs: totalIntervenants - intervenantsActifs,
      intervenantsAvecSeances: chargeParIntervenant.filter(i => i.nombreSeances > 0).length,
      tauxChargeMoyen
    },
    charge: {
      parIntervenant: chargeParIntervenant,
      top10Charges,
      surcharge: intervenantsSurcharge,
      sousUtilises: intervenantsSousUtilises
    },
    repartition: {
      parType: totalHeuresParType,
      parSpecialite: statsParSpecialite
    },
    alertes: {
      nombreSurcharges: intervenantsSurcharge.length,
      nombreSousUtilises: intervenantsSousUtilises.length
    }
  });
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
