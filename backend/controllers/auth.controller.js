const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, organization: user.organization },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

exports.register = async (req, res) => {
    try {
        const { username, email, password, organization } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if organization exists
        const orgName = organization || 'default-org';
        const orgExists = await User.findOne({ organization: orgName });
        
        // Logic: 
        // If Org does NOT exist -> New Org -> User is Admin & Active
        // If Org DOES exist -> Join Org -> User is Viewer & Pending
        const role = orgExists ? 'viewer' : 'admin';
        const status = orgExists ? 'pending' : 'active';

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role,
            organization: orgName,
            status
        });

        // Only generate token if active
        let token = null;
        if (status === 'active') {
             token = generateToken(user);
        }

        res.status(201).json({
            token, // Will be null if pending
            message: status === 'pending' ? 'Registration successful. Waiting for admin approval.' : 'Registration successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                organization: user.organization,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check Status
        if (user.status === 'pending') {
            return res.status(403).json({ message: 'Your account is pending approval by the workspace admin.' });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                organization: user.organization,
                subscribersCount: user.subscribersCount
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ 
            organization: req.user.organization, 
            status: 'pending' 
        }).select('username email createdAt');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Security: Ensure admin can only approve users in THEIR org
        if (user.organization !== req.user.organization) {
            return res.status(403).json({ message: 'Not authorized to approve this user' });
        }

        user.status = 'active';
        await user.save();

        res.json({ message: `User ${user.username} approved successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
