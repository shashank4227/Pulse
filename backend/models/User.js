const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false // Do not return password by default
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'viewer'
    },
    // For Multi-tenant isolation (optional stretch: users belong to an Organization)
    organization: {
        type: String, 
        default: 'default-org'
    },
    subscribersCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'pending'],
        default: 'pending' 
    }
}, { timestamps: true });

// Password Hashing Middleware
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Password Comparison Method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
