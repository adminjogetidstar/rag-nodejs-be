import { AuditLogModel } from "../models/index.js";

const auditLogger = (req, res, next) => {
  const start = Date.now();
  const oldSend = res.send;

  let responseBody;
  res.send = function (body) {
    responseBody = body;
    return oldSend.apply(res, arguments);
  };


  const shouldLogNumber = req.originalUrl.includes("/whapify/webhook");

  res.on("finish", () => {
    const duration = Date.now() - start;

    AuditLogModel.create({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      duration: `${duration} ms`,
      userId: req.user ? req.user.userId : null,
      number: shouldLogNumber ? req.body?.data?.phone : null,
      requestQuery: JSON.stringify(req.query),
      requestBody: JSON.stringify(req.body),
      response: responseBody
    });
    
  });

  next();
};

export default auditLogger;
