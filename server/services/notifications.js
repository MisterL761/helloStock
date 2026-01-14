const nodemailer = require('nodemailer');
const pool = require('../config/database');
const { writeLog } = require('../middleware/logger');

const FROM_EMAIL = process.env.FROM_EMAIL || 'lucas@hello-fermetures.com';
const FROM_NAME = process.env.FROM_NAME || 'Hello Fermetures - Gestion Stock';
const TO_EMAIL = process.env.TO_EMAIL || 'lucas@hello-fermetures.com,henrique@hello-fermetures.com';

class StockNotifier {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async createNotificationTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS stock_notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          notification_date DATETIME NOT NULL,
          items_count INT NOT NULL,
          items_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      writeLog('stock_notifications.log', 'Table stock_notifications créée/vérifiée');
    } catch (error) {
      writeLog('stock_notifications.log', `Erreur création table: ${error.message}`);
      throw error;
    }
  }

  async checkStockLevels() {
    try {
      writeLog('stock_notifications.log', 'Début de la vérification des stocks');

      const [items] = await pool.query(`
        SELECT id, material, supplier, category, stock, threshold,
          CASE
            WHEN stock = 0 THEN 'Rupture'
            WHEN stock < threshold THEN 'Faible Stock'
            ELSE 'Disponible'
          END as status,
          price
        FROM inventory
        WHERE stock <= threshold
        ORDER BY status DESC, supplier, material
      `);

      if (items.length > 0) {
        writeLog('stock_notifications.log', `Articles trouvés avec stock faible: ${items.length}`);

        if (!(await this.wasRecentlyNotified())) {
          await this.sendStockAlert(items);
          await this.logNotification(items);
        } else {
          writeLog('stock_notifications.log', 'Notification déjà envoyée récemment, pas d\'envoi');
        }
      } else {
        writeLog('stock_notifications.log', 'Aucun article en stock faible trouvé');
      }

      return {
        success: true,
        items_count: items.length,
        message: items.length > 0
          ? `Trouvé ${items.length} article(s) nécessitant attention`
          : 'Tous les stocks sont normaux'
      };
    } catch (error) {
      writeLog('stock_notifications.log', `Erreur: ${error.message}`);
      throw error;
    }
  }

  async sendStockAlert(items) {
    try {
      writeLog('stock_notifications.log', 'Préparation de l\'email de notification');

      const rupture = items.filter(item => item.status === 'Rupture');
      const faibleStock = items.filter(item => item.status === 'Faible Stock');

      const subject = `Rapport stock Hello Fermetures - ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}h${rupture.length > 0 ? ' - Action requise' : ''}`;

      const htmlContent = this.generateProfessionalHTML(rupture, faibleStock);
      const textContent = this.generateProfessionalText(rupture, faibleStock);

      await this.transporter.sendMail({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        subject: subject,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Mailer': 'Hello Fermetures Stock Management v2.0',
          'X-Priority': '3',
          'Organization': 'Hello Fermetures'
        }
      });

      writeLog('stock_notifications.log', `Email envoyé avec succès à ${TO_EMAIL}`);
      return true;
    } catch (error) {
      writeLog('stock_notifications.log', `Erreur envoi email: ${error.message}`);
      throw error;
    }
  }

  generateProfessionalHTML(rupture, faibleStock) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport Stock</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 5px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .section { margin: 25px 0; }
        .priority-high { background: #ffedef; border-left: 3px solid #e74c3c; padding: 15px; margin: 15px 0; }
        .priority-medium { background: #fff8e1; border-left: 3px solid #f39c12; padding: 15px; margin: 15px 0; }
        .item-list { margin: 15px 0; }
        .item { margin: 8px 0; padding: 12px; border: 1px solid #ecf0f1; border-radius: 3px; background: #fdfdfd; }
        .footer { background: #95a5a6; color: white; padding: 15px; text-align: center; font-size: 11px; }
        .status-critical { color: #c0392b; font-weight: 600; }
        .status-low { color: #d68910; font-weight: 600; }
        h3 { margin-top: 0; color: #2c3e50; }
        .summary { background: #ecf0f1; padding: 15px; border-radius: 3px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Rapport de Stock</h1>
            <p>Hello Fermetures - ${dateStr} à ${timeStr}</p>
        </div>
        <div class="content">
            <div class="summary">
                <strong>Résumé :</strong> ${rupture.length + faibleStock.length} article(s) nécessitent votre attention.
            </div>`;

    if (rupture.length > 0) {
      html += `<div class="section">
                <div class="priority-high">
                    <h3>Articles en rupture de stock (${rupture.length})</h3>
                    <p>Ces articles nécessitent un réapprovisionnement immédiat.</p>
                </div>
                <div class="item-list">`;

      rupture.forEach(item => {
        html += `<div class="item">
                    <strong>${this.escapeHtml(item.material)}</strong><br>
                    Fournisseur: ${this.escapeHtml(item.supplier)}<br>
                    Catégorie: ${this.escapeHtml(item.category)}<br>
                    <span class="status-critical">Stock actuel: ${item.stock}</span> | Seuil minimum: ${item.threshold}
                </div>`;
      });
      html += '</div></div>';
    }

    if (faibleStock.length > 0) {
      html += `<div class="section">
                <div class="priority-medium">
                    <h3>Articles en stock faible (${faibleStock.length})</h3>
                    <p>Réapprovisionnement recommandé sous 15 jours.</p>
                </div>
                <div class="item-list">`;

      faibleStock.forEach(item => {
        html += `<div class="item">
                    <strong>${this.escapeHtml(item.material)}</strong><br>
                    Fournisseur: ${this.escapeHtml(item.supplier)}<br>
                    Catégorie: ${this.escapeHtml(item.category)}<br>
                    <span class="status-low">Stock actuel: ${item.stock}</span> | Seuil minimum: ${item.threshold}
                </div>`;
      });
      html += '</div></div>';
    }

    html += `</div>
        <div class="footer">
            <p>Rapport généré automatiquement par le système de gestion Hello Fermetures</p>
            <p>Ce message est envoyé à des fins professionnelles uniquement</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  generateProfessionalText(rupture, faibleStock) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    let text = 'RAPPORT DE STOCK - Hello Fermetures\n';
    text += '===================================\n';
    text += `Date: ${dateStr} à ${timeStr}\n\n`;
    text += `RESUME: ${rupture.length + faibleStock.length} article(s) nécessitent votre attention.\n\n`;

    if (rupture.length > 0) {
      text += `ARTICLES EN RUPTURE DE STOCK (${rupture.length})\n`;
      text += 'Réapprovisionnement immédiat requis\n';
      text += '-----------------------------------\n\n';

      rupture.forEach(item => {
        text += `• ${item.material}\n`;
        text += `  Fournisseur: ${item.supplier}\n`;
        text += `  Catégorie: ${item.category}\n`;
        text += `  Stock actuel: ${item.stock} | Seuil: ${item.threshold}\n\n`;
      });
    }

    if (faibleStock.length > 0) {
      text += `ARTICLES EN STOCK FAIBLE (${faibleStock.length})\n`;
      text += 'Réapprovisionnement recommandé\n';
      text += '-------------------------------\n\n';

      faibleStock.forEach(item => {
        text += `• ${item.material}\n`;
        text += `  Fournisseur: ${item.supplier}\n`;
        text += `  Catégorie: ${item.category}\n`;
        text += `  Stock actuel: ${item.stock} | Seuil: ${item.threshold}\n\n`;
      });
    }

    text += '---\n';
    text += 'Rapport généré automatiquement par Hello Fermetures\n';
    text += 'Message professionnel - Ne pas répondre\n';

    return text;
  }

  async wasRecentlyNotified() {
    try {
      await this.createNotificationTable();

      const [result] = await pool.query(`
        SELECT COUNT(*) as count
        FROM stock_notifications
        WHERE notification_date > DATE_SUB(NOW(), INTERVAL 72 HOUR)
      `);

      return result[0].count > 0;
    } catch (error) {
      writeLog('stock_notifications.log', `Erreur vérification notifications: ${error.message}`);
      return false;
    }
  }

  async logNotification(items) {
    try {
      await pool.query(
        'INSERT INTO stock_notifications (notification_date, items_count, items_data) VALUES (NOW(), ?, ?)',
        [items.length, JSON.stringify(items)]
      );

      writeLog('stock_notifications.log', 'Notification enregistrée en base de données');
    } catch (error) {
      writeLog('stock_notifications.log', `Erreur enregistrement notification: ${error.message}`);
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = StockNotifier;
