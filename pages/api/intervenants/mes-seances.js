// pages/api/intervenants/mes-seances.js
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Get intervenant by session user email
    const intervenant = await prisma.intervenant.findUnique({
      where: { email: session.user.email }
    });

    if (!intervenant) {
      return res.status(404).json({ error: 'Intervenant introuvable' });
    }

    const { status, startDate, endDate, moduleId, includeStats } = req.query;

    // Build where clause
    const where = {
      intervenantId: intervenant.id
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (startDate && endDate) {
      where.dateSeance = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (moduleId && moduleId !== 'all') {
      where.moduleId = moduleId;
    }

    // Get sessions
    const seances = await prisma.seance.findMany({
      where,
      include: {
        module: {
          include: {
            programme: {
              select: {
                id: true,
                code: true,
                name: true,
                niveau: true
              }
            }
          }
        }
      },
      orderBy: [
        { dateSeance: 'asc' },
        { heureDebut: 'asc' }
      ]
    });

    // Calculate statistics if requested
    let stats = null;
    if (includeStats === 'true') {
      const totalSeances = seances.length;
      const seancesTerminees = seances.filter(s => s.status === 'TERMINE').length;
      const seancesEnCours = seances.filter(s => s.status === 'EN_COURS').length;
      const seancesPlanifiees = seances.filter(s => s.status === 'PLANIFIE' || s.status === 'CONFIRME').length;

      const totalHeures = seances.reduce((sum, s) => sum + s.duree, 0);
      const heuresEffectuees = seances
        .filter(s => s.status === 'TERMINE')
        .reduce((sum, s) => sum + s.duree, 0);

      // Get pending sessions (past sessions not marked as complete)
      const now = new Date();
      const seancesEnRetard = seances.filter(s => {
        const seanceDateTime = new Date(s.dateSeance);
        const [hours, minutes] = s.heureFin.split(':');
        seanceDateTime.setHours(parseInt(hours), parseInt(minutes));

        return seanceDateTime < now && s.status !== 'TERMINE' && s.status !== 'ANNULE';
      });

      stats = {
        total: totalSeances,
        terminees: seancesTerminees,
        enCours: seancesEnCours,
        planifiees: seancesPlanifiees,
        enRetard: seancesEnRetard.length,
        totalHeures,
        heuresEffectuees,
        tauxCompletion: totalSeances > 0 ? Math.round((seancesTerminees / totalSeances) * 100) : 0
      };
    }

    // Group by module if needed
    const modulesMap = {};
    seances.forEach(seance => {
      if (!modulesMap[seance.moduleId]) {
        const completedInModule = seances.filter(
          s => s.moduleId === seance.moduleId && s.status === 'TERMINE'
        ).length;
        const totalInModule = seances.filter(s => s.moduleId === seance.moduleId).length;

        modulesMap[seance.moduleId] = {
          id: seance.module.id,
          code: seance.module.code,
          name: seance.module.name,
          vht: seance.module.vht,
          progression: seance.module.progression,
          status: seance.module.status,
          programme: seance.module.programme,
          seancesCompletees: completedInModule,
          seancesTotal: totalInModule
        };
      }
    });

    return res.status(200).json({
      seances,
      stats,
      modules: Object.values(modulesMap),
      intervenant: {
        id: intervenant.id,
        civilite: intervenant.civilite,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        email: intervenant.email
      }
    });

  } catch (error) {
    console.error('Erreur API mes-seances:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
