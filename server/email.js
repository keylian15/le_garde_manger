import nodemailer from 'nodemailer'

// MODE DÉVELOPPEMENT : mettre à false pour envoyer de vrais emails
const DEV_MODE = false // Changé à false pour utiliser un vrai service email

// Configuration de l'envoi d'emails avec Gmail
// ÉTAPES POUR CONFIGURER GMAIL:
// 1. Allez sur https://myaccount.google.com/security
// 2. Activez la validation en 2 étapes
// 3. Allez sur https://myaccount.google.com/apppasswords
// 4. Créez un nouveau mot de passe d'application
// 5. Remplacez les valeurs ci-dessous

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com'
const EMAIL_PORT = process.env.EMAIL_PORT || 587
const EMAIL_USER = process.env.EMAIL_USER || 'siame.romain.scw@gmail.com'  // REMPLACEZ par votre email Gmail
const EMAIL_PASS = process.env.EMAIL_PASS || 'aqjr nvez wvfs ehzx'  // REMPLACEZ par votre mot de passe d'application (16 caractères)
const EMAIL_FROM = process.env.EMAIL_FROM || 'Mon Garde-Manger <siame.romain.scw@gmail.com>'  // REMPLACEZ

// Créer le transporteur d'emails
export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: EMAIL_PORT === '465', // true pour le port 465, false pour les autres ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
})

// Fonction pour envoyer un email de réinitialisation de mot de passe
export async function sendPasswordResetEmail(to, resetUrl) {
  // MODE DÉVELOPPEMENT : afficher le lien dans la console sans envoyer d'email
  if (DEV_MODE) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 EMAIL DE RÉINITIALISATION (Mode Développement)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📮 Destinataire: ${to}`)
    console.log(`🔗 Lien de réinitialisation:\n   ${resetUrl}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    return { success: true, messageId: 'dev-mode-' + Date.now() }
  }
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Réinitialisation de votre mot de passe - Mon Garde-Manger',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥕 Mon Garde-Manger</h1>
          </div>
          <div class="content">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <p>Ce lien est valide pendant <strong>1 heure</strong>.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
            <p><small>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>${resetUrl}</small></p>
          </div>
          <div class="footer">
            <p>© 2026 Mon Garde-Manger - Gérez vos stocks, évitez le gaspillage</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Réinitialisation de votre mot de passe - Mon Garde-Manger
      
      Vous avez demandé à réinitialiser votre mot de passe.
      
      Cliquez sur ce lien pour définir un nouveau mot de passe :
      ${resetUrl}
      
      Ce lien est valide pendant 1 heure.
      
      Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email envoyé:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return { success: false, error: error.message }
  }
}
