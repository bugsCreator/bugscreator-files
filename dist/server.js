"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const method_override_1 = __importDefault(require("method-override"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const apiKey_1 = require("./middlewares/apiKey");
dotenv_1.default.config();
// Session types are augmented in types/session.d.ts
const app = (0, express_1.default)();
const __dirnameSafe = path_1.default.resolve();
// MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugscreator_files_ts';
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
// View engine
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirnameSafe, 'views'));
app.use(express_ejs_layouts_1.default);
app.set('layout', 'partials/layout');
// Middleware
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, method_override_1.default)('_method'));
app.use((0, morgan_1.default)('dev'));
// API key auth (non-intrusive; attaches req.apiUser if present)
app.use(apiKey_1.apiKeyAuth);
// Sessions
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_change_me';
app.use((0, express_session_1.default)({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    store: connect_mongo_1.default.create({ mongoUrl: MONGODB_URI })
}));
// Static
app.use('/public', express_1.default.static(path_1.default.join(__dirnameSafe, 'public')));
// Locals
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    next();
});
// Routes
const index_1 = __importDefault(require("./routes/index"));
const auth_1 = __importDefault(require("./routes/auth"));
const files_1 = __importDefault(require("./routes/files"));
console.log('Routes loaded:', {
    indexRoutes: typeof index_1.default,
    authRoutes: typeof auth_1.default,
    fileRoutes: typeof files_1.default,
});
app.use('/', index_1.default);
app.use('/auth', auth_1.default);
app.use('/files', files_1.default);
// 404
app.use((req, res) => {
    res.status(404).render('404', { title: 'Not Found' });
});
// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    if (req.accepts('html')) {
        res.status(500).render('error', { title: 'Error', error: err });
    }
    else {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
exports.default = app;
