// pages/api/admin/export/excel.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

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

    const { type } = req.query;

    let workbook;

    switch (type) {
      case 'salles':
        workbook = await exportSalles();
        break;
      case 'intervenants':
        workbook = await exportIntervenants();
        break;
      case 'periodes':
        workbook = await exportPeriodes();
        break;
      case 'logs':
        workbook = await exportLogs(req.query);
        break;
      case 'stats-salles':
        workbook = await exportStatsSalles(req.query);
        break;
      case 'stats-intervenants':
        workbook = await exportStatsIntervenants(req.query);
        break;
      case 'dashboard':
        workbook = await exportDashboard();
        break;
      default:
        return res.status(400).json({ error: 'Type d\'export invalide' });
    }

    // Générer le fichier Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Enregistrer l'action dans le journal
    await prisma.journalActivite.create({
      data: {
        action: 'EXPORT_DONNEES',
        entite: type,
        entiteId: 'export',
        description: `Export Excel de ${type}`,
        userId: session.user.id,
        userName: session.user.name,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    // Envoyer le fichier
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erreur export Excel:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'export', details: error.message });
  }
}

async function exportSalles() {
  const salles = await prisma.salle.findMany({
    orderBy: [
      { batiment: 'asc' },
      { nom: 'asc' }
    ]
  });

  const data = salles.map(salle => ({
    'Nom': salle.nom,
    'Bâtiment': salle.batiment,
    'Capacité': salle.capacite,
    'Équipements': salle.equipements || '',
    'Disponible': salle.disponible ? 'Oui' : 'Non',
    'Créé le': new Date(salle.createdAt).toLocaleDateString('fr-FR')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Salles');

  return workbook;
}

async function exportIntervenants() {
  const intervenants = await prisma.intervenant.findMany({
    include: {
      _count: {
        select: {
          modules: true,
          seances: true
        }
      }
    },
    orderBy: { nom: 'asc' }
  });

  const data = intervenants.map(int => ({
    'Civilité': int.civilite,
    'Nom': int.nom,
    'Prénom': int.prenom,
    'Email': int.email,
    'Téléphone': int.telephone || '',
    'Grade': int.grade || '',
    'Spécialité': int.specialite || '',
    'Établissement': int.etablissement || '',
    'Disponible': int.disponible ? 'Oui' : 'Non',
    'Heures max/jour': int.heuresMaxJour,
    'Heures max/semaine': int.heuresMaxSemaine,
    'Nombre de modules': int._count.modules,
    'Nombre de séances': int._count.seances
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Intervenants');

  return workbook;
}

async function exportPeriodes() {
  const periodes = await prisma.periodeAcademique.findMany({
    orderBy: { annee: 'desc' }
  });

  const data = periodes.map(periode => ({
    'Nom': periode.nom,
    'Année': periode.annee,
    'Début S1': new Date(periode.debutS1).toLocaleDateString('fr-FR'),
    'Fin S1': new Date(periode.finS1).toLocaleDateString('fr-FR'),
    'Début S2': new Date(periode.debutS2).toLocaleDateString('fr-FR'),
    'Fin S2': new Date(periode.finS2).toLocaleDateString('fr-FR'),
    'Vacances Noël': new Date(periode.vacancesNoel).toLocaleDateString('fr-FR'),
    'Fin Vacances Noël': new Date(periode.finVacancesNoel).toLocaleDateString('fr-FR'),
    'Vacances Pâques': periode.vacancesPaques ? new Date(periode.vacancesPaques).toLocaleDateString('fr-FR') : '',
    'Fin Vacances Pâques': periode.finVacancesPaques ? new Date(periode.finVacancesPaques).toLocaleDateString('fr-FR') : '',
    'Active': periode.active ? 'Oui' : 'Non'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Périodes Académiques');

  return workbook;
}

async function exportLogs(query) {
  const { dateDebut, dateFin } = query;

  const where = {};
  if (dateDebut || dateFin) {
    where.createdAt = {};
    if (dateDebut) where.createdAt.gte = new Date(dateDebut);
    if (dateFin) {
      const endDate = new Date(dateFin);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const logs = await prisma.journalActivite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000 // Limite à 10000 pour éviter les exports trop lourds
  });

  const data = logs.map(log => ({
    'Date': new Date(log.createdAt).toLocaleString('fr-FR'),
    'Action': log.action,
    'Entité': log.entite,
    'Description': log.description,
    'Utilisateur': log.userName || '',
    'Adresse IP': log.ipAddress || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Journaux d\'Activités');

  return workbook;
}

async function exportStatsSalles(query) {
  const { dateDebut, dateFin } = query;

  const endDate = dateFin ? new Date(dateFin) : new Date();
  const startDate = dateDebut ? new Date(dateDebut) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const salles = await prisma.salle.findMany();

  const data = await Promise.all(
    salles.map(async (salle) => {
      const seances = await prisma.seance.count({
        where: {
          salle: salle.nom,
          dateSeance: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const heures = await prisma.seance.aggregate({
        where: {
          salle: salle.nom,
          dateSeance: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { duree: true }
      });

      return {
        'Salle': salle.nom,
        'Bâtiment': salle.batiment,
        'Capacité': salle.capacite,
        'Nombre de séances': seances,
        'Heures utilisées': heures._sum.duree || 0,
        'Disponible': salle.disponible ? 'Oui' : 'Non'
      };
    })
  );

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques Salles');

  return workbook;
}

async function exportDashboard() {
  const [
    utilisateurs,
    utilisateursParRole,
    programmes,
    programmesParStatut,
    modules,
    modulesParStatut,
    intervenants,
    intervenantsActifs,
    salles,
    sallesDisponibles,
    seances,
    seancesParStatut,
    conflitsNonResolus,
    conflitsParType,
    periodeActive
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
    prisma.programme.count(),
    prisma.programme.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.module.count(),
    prisma.module.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.intervenant.count(),
    prisma.intervenant.count({ where: { disponible: true } }),
    prisma.salle.count(),
    prisma.salle.count({ where: { disponible: true } }),
    prisma.seance.count(),
    prisma.seance.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.conflit.count({ where: { resolu: false } }),
    prisma.conflit.groupBy({ by: ['type'], _count: { type: true }, where: { resolu: false } }),
    prisma.periodeAcademique.findFirst({ where: { active: true } })
  ]);

  const workbook = XLSX.utils.book_new();

  // Feuille 1 : KPIs généraux
  const kpis = [
    { 'Indicateur': 'Utilisateurs', 'Total': utilisateurs },
    ...utilisateursParRole.map(r => ({ 'Indicateur': `  - ${r.role}`, 'Total': r._count.role })),
    { 'Indicateur': 'Programmes', 'Total': programmes },
    ...programmesParStatut.map(s => ({ 'Indicateur': `  - ${s.status}`, 'Total': s._count.status })),
    { 'Indicateur': 'Modules', 'Total': modules },
    ...modulesParStatut.map(s => ({ 'Indicateur': `  - ${s.status}`, 'Total': s._count.status })),
    { 'Indicateur': 'Intervenants', 'Total': intervenants },
    { 'Indicateur': '  - Actifs', 'Total': intervenantsActifs },
    { 'Indicateur': '  - Inactifs', 'Total': intervenants - intervenantsActifs },
    { 'Indicateur': 'Salles', 'Total': salles },
    { 'Indicateur': '  - Disponibles', 'Total': sallesDisponibles },
    { 'Indicateur': '  - Occupées', 'Total': salles - sallesDisponibles },
    { 'Indicateur': 'Séances', 'Total': seances },
    ...seancesParStatut.map(s => ({ 'Indicateur': `  - ${s.status}`, 'Total': s._count.status })),
    { 'Indicateur': 'Conflits non résolus', 'Total': conflitsNonResolus },
    ...conflitsParType.map(c => ({ 'Indicateur': `  - ${c.type}`, 'Total': c._count.type }))
  ];

  const wsKpis = XLSX.utils.json_to_sheet(kpis);
  wsKpis['!cols'] = [{ wch: 30 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, wsKpis, 'KPIs');

  // Feuille 2 : Programmes détaillés
  const programmesList = await prisma.programme.findMany({
    select: { name: true, status: true, progression: true, createdAt: true }
  });
  const wsProgrammes = XLSX.utils.json_to_sheet(programmesList.map(p => ({
    'Nom': p.name,
    'Statut': p.status,
    'Progression (%)': p.progression,
    'Créé le': new Date(p.createdAt).toLocaleDateString('fr-FR')
  })));
  XLSX.utils.book_append_sheet(workbook, wsProgrammes, 'Programmes');

  // Feuille 3 : Période académique active
  if (periodeActive) {
    const wsPeriode = XLSX.utils.json_to_sheet([{
      'Nom': periodeActive.nom,
      'Année': periodeActive.annee,
      'Début S1': new Date(periodeActive.debutS1).toLocaleDateString('fr-FR'),
      'Fin S1': new Date(periodeActive.finS1).toLocaleDateString('fr-FR'),
      'Début S2': new Date(periodeActive.debutS2).toLocaleDateString('fr-FR'),
      'Fin S2': new Date(periodeActive.finS2).toLocaleDateString('fr-FR')
    }]);
    XLSX.utils.book_append_sheet(workbook, wsPeriode, 'Période Active');
  }

  // Feuille 4 : Top utilisateurs actifs (30 derniers jours)
  const topUtilisateurs = await prisma.journalActivite.groupBy({
    by: ['userId', 'userName'],
    _count: { userId: true },
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { _count: { userId: 'desc' } },
    take: 10
  });
  const wsTop = XLSX.utils.json_to_sheet(topUtilisateurs.map(u => ({
    'Utilisateur': u.userName || 'Inconnu',
    'Actions (30j)': u._count.userId
  })));
  XLSX.utils.book_append_sheet(workbook, wsTop, 'Top Utilisateurs');

  return workbook;
}

async function exportStatsIntervenants(query) {
  const { dateDebut, dateFin } = query;

  const endDate = dateFin ? new Date(dateFin) : new Date();
  const startDate = dateDebut ? new Date(dateDebut) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const intervenants = await prisma.intervenant.findMany({
    include: {
      seances: {
        where: {
          dateSeance: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    }
  });

  const data = intervenants.map(int => {
    const seancesParType = {
      CM: int.seances.filter(s => s.typeSeance === 'CM'),
      TD: int.seances.filter(s => s.typeSeance === 'TD'),
      TP: int.seances.filter(s => s.typeSeance === 'TP')
    };

    const heuresParType = {
      CM: seancesParType.CM.reduce((sum, s) => sum + (s.duree || 0), 0),
      TD: seancesParType.TD.reduce((sum, s) => sum + (s.duree || 0), 0),
      TP: seancesParType.TP.reduce((sum, s) => sum + (s.duree || 0), 0)
    };

    const totalHeures = Object.values(heuresParType).reduce((sum, h) => sum + h, 0);

    return {
      'Intervenant': `${int.prenom} ${int.nom}`,
      'Email': int.email,
      'Spécialité': int.specialite || '',
      'Nombre de séances': int.seances.length,
      'Heures CM': heuresParType.CM,
      'Heures TD': heuresParType.TD,
      'Heures TP': heuresParType.TP,
      'Total heures': totalHeures,
      'Heures max/semaine': int.heuresMaxSemaine
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques Intervenants');

  return workbook;
}
