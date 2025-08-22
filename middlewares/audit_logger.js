import { AuditLogModel } from "../models/index.js";

const auditLogger = (req, res, next) => {
  const start = Date.now();
  const oldSend = res.send;

  let responseBody;

  const shouldLogResponse = req.originalUrl.includes("/whapify/webhook");

  if (shouldLogResponse) {
    res.send = function (body) {
      responseBody = body;
      return oldSend.apply(res, arguments);
    };
  }

  res.on("finish", () => {
    const duration = Date.now() - start;

    AuditLogModel.create({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      duration: `${duration} ms`,
      userId: req.user.userId,
      number: shouldLogResponse ? log.response : null, // Hanya simpan nomor jika endpoint whapify
    });
    
  });

  next();
};

export default auditLogger;
