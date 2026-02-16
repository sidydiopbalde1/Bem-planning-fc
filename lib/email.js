// lib/email.js
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('Email skipped (not configured):', { to, subject });
    return { success: false, message: 'Email not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"BEM Planning FC" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
export const emailTemplates = {
  programmeEnRetard: (programme, coordinateur) => ({
    subject: `⚠️ Alerte: Programme en retard - ${programme.code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Programme en retard</h2>
        <p>Bonjour ${coordinateur.name},</p>

        <p>Le programme suivant est en retard par rapport à son échéance:</p>

        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${programme.code} - ${programme.name}</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Progression:</strong> ${programme.progression}%</li>
            <li><strong>Date de fin:</strong> ${new Date(programme.dateFin).toLocaleDateString('fr-FR')}</li>
            <li><strong>Niveau:</strong> ${programme.niveau}</li>
            <li><strong>Semestre:</strong> ${programme.semestre}</li>
          </ul>
        </div>

        <p>Action requise: Veuillez mettre à jour le planning ou ajuster les échéances.</p>

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/coordinateur/programmes/${programme.id}"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir le programme
          </a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Programme en retard: ${programme.code} - ${programme.name}\nProgression: ${programme.progression}%\nDate de fin: ${new Date(programme.dateFin).toLocaleDateString('fr-FR')}`
  }),

  moduleSansIntervenant: (module, programme, coordinateur) => ({
    subject: `⚠️ Module sans intervenant - ${module.code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">⚠️ Module sans intervenant</h2>
        <p>Bonjour ${coordinateur.name},</p>

        <p>Le module suivant n'a pas d'intervenant assigné:</p>

        <div style="background-color: #ffedd5; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${module.code} - ${module.name}</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Programme:</strong> ${programme.code} - ${programme.name}</li>
            <li><strong>Volume horaire:</strong> ${module.vht}h (CM: ${module.cm}h, TD: ${module.td}h, TP: ${module.tp}h)</li>
            <li><strong>Date de début:</strong> ${module.dateDebut ? new Date(module.dateDebut).toLocaleDateString('fr-FR') : 'Non définie'}</li>
            <li><strong>Statut:</strong> ${module.status}</li>
          </ul>
        </div>

        <p>Action requise: Veuillez assigner un intervenant à ce module.</p>

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/coordinateur/modules"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Gérer les modules
          </a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Module sans intervenant: ${module.code} - ${module.name}\nProgramme: ${programme.code}\nVolume: ${module.vht}h`
  }),

  moduleProchainement: (module, programme, coordinateur) => ({
    subject: `📅 Module démarrant prochainement - ${module.code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📅 Module démarrant prochainement</h2>
        <p>Bonjour ${coordinateur.name},</p>

        <p>Le module suivant démarre dans moins de 7 jours:</p>

        <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${module.code} - ${module.name}</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Programme:</strong> ${programme.code} - ${programme.name}</li>
            <li><strong>Date de début:</strong> ${new Date(module.dateDebut).toLocaleDateString('fr-FR')}</li>
            <li><strong>Volume horaire:</strong> ${module.vht}h</li>
            <li><strong>Intervenant:</strong> ${module.intervenant ? `${module.intervenant.prenom} ${module.intervenant.nom}` : '⚠️ Non assigné'}</li>
          </ul>
        </div>

        ${!module.intervenant ? '<p style="color: #dc2626;"><strong>⚠️ Attention:</strong> Ce module n\'a pas d\'intervenant assigné!</p>' : ''}

        <p>Assurez-vous que toutes les ressources nécessaires sont prêtes.</p>

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/coordinateur/modules"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir les détails
          </a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Module démarrant prochainement: ${module.code} - ${module.name}\nDate: ${new Date(module.dateDebut).toLocaleDateString('fr-FR')}\nVolume: ${module.vht}h`
  }),

  rapportHebdomadaire: (coordinateur, stats) => ({
    subject: `📊 Rapport hebdomadaire - BEM Planning FC`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">📊 Rapport hebdomadaire</h2>
        <p>Bonjour ${coordinateur.name},</p>

        <p>Voici un résumé de vos programmes et modules cette semaine:</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Programmes</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Total:</strong> ${stats.programmesStats.total}
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>En cours:</strong> ${stats.programmesStats.enCours}
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Terminés:</strong> ${stats.programmesStats.termines}
            </li>
            <li style="padding: 8px 0;">
              <strong>Progression moyenne:</strong> ${stats.programmesStats.progressionMoyenne}%
            </li>
          </ul>

          <h3 style="margin-top: 20px;">Modules</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Total:</strong> ${stats.modulesStats.total}
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Volume horaire total:</strong> ${stats.modulesStats.totalVHT}h
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Avec intervenant:</strong> ${stats.modulesStats.avecIntervenant}
            </li>
            <li style="padding: 8px 0;">
              <strong>Sans intervenant:</strong> ${stats.modulesStats.sansIntervenant}
            </li>
          </ul>
        </div>

        ${stats.programmesEnRetard.length > 0 ? `
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ Alertes</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>${stats.programmesEnRetard.length} programme(s) en retard</li>
              ${stats.modulesSansIntervenant.length > 0 ? `<li>${stats.modulesSansIntervenant.length} module(s) sans intervenant</li>` : ''}
            </ul>
          </div>
        ` : ''}

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/coordinateur/dashboard"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir le tableau de bord
          </a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Rapport hebdomadaire\nProgrammes: ${stats.programmesStats.total} (${stats.programmesStats.enCours} en cours)\nModules: ${stats.modulesStats.total} (${stats.modulesStats.totalVHT}h)`
  }),

  modificationPlanning: (seance, modification, destinataire) => ({
    subject: `🔄 Modification de planning - ${seance.module?.code || 'Séance'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🔄 Modification de planning</h2>
        <p>Bonjour ${destinataire.name || destinataire.prenom + ' ' + destinataire.nom},</p>

        <p>Une séance de cours a été modifiée dans votre planning:</p>

        <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${seance.module?.code || ''} - ${seance.module?.name || 'Séance'}</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Date:</strong> ${new Date(seance.dateSeance).toLocaleDateString('fr-FR')}</li>
            <li><strong>Horaires:</strong> ${seance.heureDebut} - ${seance.heureFin}</li>
            <li><strong>Type:</strong> ${seance.typeSeance}</li>
            <li><strong>Salle:</strong> ${seance.salle || 'Non définie'}</li>
            ${seance.intervenant ? `<li><strong>Intervenant:</strong> ${seance.intervenant.prenom} ${seance.intervenant.nom}</li>` : ''}
          </ul>
          ${modification ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #93c5fd;">
              <p style="margin: 0; font-weight: bold; color: #1e40af;">Modifications:</p>
              <p style="margin: 5px 0 0 0; color: #1e40af;">${modification}</p>
            </div>
          ` : ''}
        </div>

        <p>Veuillez prendre note de ces modifications dans votre emploi du temps.</p>

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/planning"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir mon planning
          </a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Modification de planning\nModule: ${seance.module?.code}\nDate: ${new Date(seance.dateSeance).toLocaleDateString('fr-FR')}\nHoraires: ${seance.heureDebut} - ${seance.heureFin}`
  }),

  conflitDetecte: (conflit, seance1, seance2, coordinateur) => ({
    subject: `⚠️ Conflit détecté - ${conflit.type}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Conflit de planning détecté</h2>
        <p>Bonjour ${coordinateur.name},</p>

        <p>Un conflit de type <strong>${conflit.type}</strong> (sévérité: ${conflit.severite}) a été détecté:</p>

        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #991b1b;"><strong>${conflit.description}</strong></p>

          <h4 style="margin: 15px 0 10px 0;">Séance 1:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Module:</strong> ${seance1.module?.code} - ${seance1.module?.name}</li>
            <li><strong>Date:</strong> ${new Date(seance1.dateSeance).toLocaleDateString('fr-FR')}</li>
            <li><strong>Horaires:</strong> ${seance1.heureDebut} - ${seance1.heureFin}</li>
            <li><strong>Salle:</strong> ${seance1.salle || 'Non définie'}</li>
            ${seance1.intervenant ? `<li><strong>Intervenant:</strong> ${seance1.intervenant.prenom} ${seance1.intervenant.nom}</li>` : ''}
          </ul>

          ${seance2 ? `
            <h4 style="margin: 15px 0 10px 0;">Séance 2:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Module:</strong> ${seance2.module?.code} - ${seance2.module?.name}</li>
              <li><strong>Date:</strong> ${new Date(seance2.dateSeance).toLocaleDateString('fr-FR')}</li>
              <li><strong>Horaires:</strong> ${seance2.heureDebut} - ${seance2.heureFin}</li>
              <li><strong>Salle:</strong> ${seance2.salle || 'Non définie'}</li>
              ${seance2.intervenant ? `<li><strong>Intervenant:</strong> ${seance2.intervenant.prenom} ${seance2.intervenant.nom}</li>` : ''}
            </ul>
          ` : ''}
        </div>

        <p><strong>Action requise:</strong> Veuillez résoudre ce conflit dès que possible pour éviter des perturbations dans le planning.</p>

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/coordinateur/conflits"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Gérer les conflits
          </a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Conflit détecté: ${conflit.type}\nSévérité: ${conflit.severite}\n${conflit.description}`
  }),

  evaluationDisponible: (module, intervenant, lienEvaluation) => ({
    subject: `📝 Évaluation de votre enseignement - ${module.code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">📝 Évaluation de votre enseignement</h2>
        <p>Bonjour ${intervenant.prenom} ${intervenant.nom},</p>

        <p>Les étudiants vont prochainement évaluer votre enseignement pour le module suivant:</p>

        <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${module.code} - ${module.name}</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Programme:</strong> ${module.programme?.code} - ${module.programme?.name}</li>
            <li><strong>Volume horaire:</strong> ${module.vht}h</li>
          </ul>
        </div>

        <p>Cette évaluation permettra d'améliorer la qualité de l'enseignement et de prendre en compte vos retours.</p>

        ${lienEvaluation ? `
          <p style="margin-top: 30px;">
            <a href="${lienEvaluation}"
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les résultats (après évaluation)
            </a>
          </p>
        ` : ''}

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Évaluation de votre enseignement\nModule: ${module.code} - ${module.name}\nProgramme: ${module.programme?.code}`
  }),

  rotationsWeekendGenerees: (destinataire, rotationsParCoordinateur, toutesRotations) => {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    // Tableau récapitulatif de toutes les rotations
    const tableauRotations = toutesRotations.map(r => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${new Date(r.dateDebut).toLocaleDateString('fr-FR', dateOptions)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${new Date(r.dateFin).toLocaleDateString('fr-FR', dateOptions)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">S${r.semaineNumero}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: ${r.responsable?.name === destinataire.name ? 'bold; color: #059669' : 'normal'};">${r.responsable?.name || 'N/A'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${r.nbSeancesTotal || 0}</td>
      </tr>
    `).join('');

    // Résumé par coordinateur
    const resumeCoordinateurs = rotationsParCoordinateur.map(c => `
      <li style="padding: 4px 0;"><strong>${c.name}</strong>: ${c.nbWeekends} weekend(s)</li>
    `).join('');

    // Les weekends spécifiques au destinataire
    const mesWeekends = toutesRotations.filter(r => r.responsableId === destinataire.id);
    const mesWeekendsHtml = mesWeekends.length > 0 ? mesWeekends.map(r => `
      <li style="padding: 4px 0;">
        <strong>${new Date(r.dateDebut).toLocaleDateString('fr-FR', dateOptions)}</strong> - ${new Date(r.dateFin).toLocaleDateString('fr-FR', dateOptions)} (S${r.semaineNumero}) - ${r.nbSeancesTotal || 0} séance(s)
      </li>
    `).join('') : '';

    return {
      subject: `📋 Planning des rotations weekends généré - ${toutesRotations.length} weekends`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #059669;">📋 Nouveau planning des rotations weekends</h2>
          <p>Bonjour ${destinataire.name},</p>

          <p>Un nouveau planning de rotations weekends vient d'être généré. Voici le détail complet:</p>

          ${mesWeekends.length > 0 ? `
          <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Vos weekends assignés (${mesWeekends.length})</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${mesWeekendsHtml}
            </ul>
          </div>
          ` : ''}

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Répartition par coordinateur</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${resumeCoordinateurs}
            </ul>
          </div>

          <h3 style="margin-top: 25px;">Planning complet (${toutesRotations.length} weekends)</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #059669; color: white;">
                  <th style="padding: 10px 12px; text-align: left;">Début</th>
                  <th style="padding: 10px 12px; text-align: left;">Fin</th>
                  <th style="padding: 10px 12px; text-align: left;">Semaine</th>
                  <th style="padding: 10px 12px; text-align: left;">Responsable</th>
                  <th style="padding: 10px 12px; text-align: center;">Séances</th>
                </tr>
              </thead>
              <tbody>
                ${tableauRotations}
              </tbody>
            </table>
          </div>

          <p style="margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/rotations-weekend"
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les rotations
            </a>
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
          </p>
        </div>
      `,
      text: `Planning des rotations weekends généré\n${toutesRotations.length} weekends planifiés.\n\nVos weekends: ${mesWeekends.map(r => `${new Date(r.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(r.dateFin).toLocaleDateString('fr-FR')}`).join('\n')}\n\nRépartition:\n${rotationsParCoordinateur.map(c => `${c.name}: ${c.nbWeekends} weekend(s)`).join('\n')}`
    };
  },

  seanceNonTerminee: (seance, intervenant) => ({
    subject: `⚠️ Séance à compléter - ${seance.module.code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">⚠️ Séance non marquée comme terminée</h2>
        <p>Bonjour ${intervenant.civilite} ${intervenant.prenom} ${intervenant.nom},</p>

        <p>La séance de cours suivante n'a pas encore été marquée comme terminée. Merci de compléter cette séance pour mettre à jour la progression du module.</p>

        <div style="background-color: #ffedd5; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${seance.module.code} - ${seance.module.name}</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Date:</strong> ${new Date(seance.dateSeance).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
            <li><strong>Horaires:</strong> ${seance.heureDebut} - ${seance.heureFin} (${seance.duree}h)</li>
            <li><strong>Type:</strong> ${seance.typeSeance}</li>
            ${seance.salle ? `<li><strong>Salle:</strong> ${seance.salle}${seance.batiment ? ' - ' + seance.batiment : ''}</li>` : ''}
            <li><strong>Programme:</strong> ${seance.module.programme?.name || 'N/A'}</li>
          </ul>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>💡 Important:</strong> Marquer vos séances comme terminées permet de suivre automatiquement la progression de vos modules et programmes.
          </p>
        </div>

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/intervenant/mes-seances"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Marquer la séance comme terminée
          </a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Ceci est un email automatique de BEM Planning FC. Ne pas répondre à cet email.
        </p>
      </div>
    `,
    text: `Séance non terminée\nModule: ${seance.module.code} - ${seance.module.name}\nDate: ${new Date(seance.dateSeance).toLocaleDateString('fr-FR')}\nHoraires: ${seance.heureDebut} - ${seance.heureFin}\n\nMerci de marquer cette séance comme terminée sur: ${process.env.NEXTAUTH_URL}/intervenant/mes-seances`
  })
};
