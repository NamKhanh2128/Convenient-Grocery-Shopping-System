const nodemailer = require('nodemailer');

const MAIL_FROM = process.env.MAIL_FROM || 'NATEAT <no-reply@nateat.vn>';

let transporterPromise;

function getTransporter() {
  if (!transporterPromise) {
    if (process.env.SMTP_HOST) {
      transporterPromise = Promise.resolve(
        nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
        })
      );
    } else {
      transporterPromise = Promise.resolve(null);
    }
  }

  return transporterPromise;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = await getTransporter();

  if (!transporter) {
    console.log('\n========== [emailService] DEV MODE - EMAIL NOT SENT ==========');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log('================================================================\n');
    return { delivered: false, dev: true };
  }

  await transporter.sendMail({ from: MAIL_FROM, to, subject, text, html });
  return { delivered: true, dev: false };
}

const emailService = {
  sendMail,

  async sendPasswordResetEmail(to, resetUrl) {
    return sendMail({
      to,
      subject: 'NATEAT - Yêu cầu đặt lại mật khẩu',
      text: `Nhan vao lien ket sau de dat lai mat khau (het han sau 60 phut): ${resetUrl}`,
      html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản NATEAT.</p>
             <p><a href="${resetUrl}">Nhấn vào đây để đặt lại mật khẩu</a> (liên kết hết hạn sau 60 phút).</p>
             <p>Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email này.</p>`,
    });
  },

  async sendFamilyInvitationEmail(to, { familyName, inviterName, acceptUrl }) {
    return sendMail({
      to,
      subject: `${inviterName} đã mời bạn tham gia gia đình "${familyName}" trên NATEAT`,
      text: `${inviterName} da moi ban tham gia gia dinh "${familyName}". Nhan vao lien ket de chap nhan: ${acceptUrl}`,
      html: `<p><b>${inviterName}</b> đã mời bạn tham gia gia đình <b>${familyName}</b> trên NATEAT.</p>
             <p><a href="${acceptUrl}">Nhấn vào đây để chấp nhận lời mời</a> (liên kết hết hạn sau 7 ngày).</p>
             <p>Nếu bạn chưa có tài khoản, bạn sẽ được yêu cầu đăng ký bằng email này trước khi tham gia.</p>`,
    });
  },
};

module.exports = { emailService };
