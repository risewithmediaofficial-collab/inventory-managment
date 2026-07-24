import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
        'VIEW', 'EXPORT', 'IMPORT', 'PRINT', 'APPROVE', 'REJECT',
      ],
      required: true,
    },
    resource: { type: String, required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    resourceNumber: String,
    description: String,
    oldValues: { type: mongoose.Schema.Types.Mixed },
    newValues: { type: mongoose.Schema.Types.Mixed },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: String,
    userName: String,
    ipAddress: String,
    userAgent: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

auditSchema.index({ companyId: 1, createdAt: -1 });
auditSchema.index({ user: 1 });
auditSchema.index({ resource: 1, resourceId: 1 });

const Audit = mongoose.model('Audit', auditSchema);
export default Audit;
