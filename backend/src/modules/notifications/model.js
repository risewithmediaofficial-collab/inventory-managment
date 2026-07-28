import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'low_stock', 'out_of_stock', 'new_sale', 'new_purchase',
        'payment_received', 'payment_due', 'stock_transfer',
        'stock_adjustment', 'product_expiring', 'backup_completed',
        'system', 'info', 'warning', 'error',
      ],
      required: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    reference: { type: mongoose.Schema.Types.ObjectId },
    referenceType: String,
    referenceNumber: String,

    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isGlobal: { type: Boolean, default: false },

    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],

    actionUrl: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ companyId: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
