import mongoose from 'mongoose';

const EmployeeProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, 'Please add a valid 10-digit phone number']
  },
  operationalRole: {
    type: String
  },
  dashboardPreferences: {
    type: Object,
    default: {}
  },
  assignedTasks: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('EmployeeProfile', EmployeeProfileSchema);
