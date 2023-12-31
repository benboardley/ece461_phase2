"use strict";
/**
 * dbCommunicator.ts - A class for interacting with a MySQL database using the mysql2 library.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userType = void 0;
var promise_1 = __importDefault(require("mysql2/promise"));
var logger_1 = __importDefault(require("./logger"));
require("dotenv/config");
var Schemas = __importStar(require("./schemas"));
//require('mysql2/node_modules/iconv-lite').encodingExists('foo');
/**
 * An enum for the different user types.
 * Highest permission level is admin, lowest is guest.
 * Keep user type values in order from lowest to highest permission level (if possible).
 */
var userType;
(function (userType) {
    userType[userType["guest"] = 0] = "guest";
    userType[userType["user"] = 1] = "user";
    userType[userType["admin"] = 2] = "admin";
})(userType || (exports.userType = userType = {}));
/**
 * Database configuration object.
 */
var dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    logger_1.default.error('Missing database configuration.');
    process.exit(1);
}
/* TODO List / Things to Implement/Consider:
    * - Add the logger to the DBCommunicator class
    * - Create authorization levels for the database
    * - Add a way to check user permissions for certain queries (function, method, etc.)
    * - tests
    * - Database Connection Pooling:
        Consider using a connection pool for your database connections.
        Connection pooling can help improve performance and security.
        It manages the connections efficiently, reducing the risk of
        resource exhaustion and other issues.
    * - SQL Injection Prevention:
        Your code currently uses parameterized queries, which is a good
        practice to prevent SQL injection. However, it's essential to
        ensure that all SQL queries, even dynamic ones, are properly
        parameterized to eliminate the risk of injection.
    * - Authentication and Authorization:
        This code snippet does not address authentication and authorization,
        which are critical components of database security. Ensure that your
        MySQL server is properly configured with user accounts and access
        control to limit the exposure of your database.
    * - Secure Your Environment:
        Make sure your production environment is adequately secured, including
        firewalls, intrusion detection, and monitoring systems.
    * - Data Encryption:
        Ensure that your database connections are encrypted, especially for
        production environments. MySQL supports SSL/TLS encryption for secure data transmission.
    * - Data Validation:
        Ensure that any data passed into SQL queries is validated and sanitized.
        This includes not just parameterized queries but also checking data types
        and lengths to prevent data-related vulnerabilities.
    * - Audit Trails:
        Consider adding audit trails to log and monitor all activities within the
        database to detect and respond to any suspicious or unauthorized behavior.
 */
/**
 * A class for interacting with a MySQL database using the mysql2 library.
 */
var DBCommunicator = /** @class */ (function () {
    /**
     * Constructor for DBCommunicator.
     * It establishes a connection to the MySQL database.
     */
    function DBCommunicator() {
        this.connection = null;
        this.authorization = null;
        this.connect();
    }
    /**
     * Establishes a connection to the MySQL database.
     */
    DBCommunicator.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = this;
                        return [4 /*yield*/, promise_1.default.createConnection(dbConfig)];
                    case 1:
                        _a.connection = _b.sent();
                        logger_1.default.info('Connected to MySQL database'); // replace with logger when we gain access to it
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        logger_1.default.error('Error connecting to the database:' + error_1); // replace with logger when we gain access to it
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DBCommunicator.prototype.resetRegistry = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sql, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "DELETE FROM packages";
                        return [4 /*yield*/, this.query(sql)];
                    case 1:
                        result = _a.sent();
                        if (result == null || typeof (result) == "number") {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    DBCommunicator.prototype.searchPackagesByRegex = function (regex) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result, packageMetaList, i, packageID, packageName, packageMeta;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "SELECT name, version, package_id FROM packages WHERE name REGEXP ? OR description REGEXP ?";
                        values = [regex, regex];
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (result == null || !Array.isArray(result) || result.length === 0 || typeof (result) == "number") {
                            return [2 /*return*/, []];
                        }
                        packageMetaList = [];
                        for (i = 0; i < result.length; i++) {
                            packageID = result[i].package_id;
                            packageName = result[i].name;
                            packageMeta = {
                                Name: packageName,
                                Version: result[i].version,
                                ID: packageID
                            };
                            packageMetaList.push(packageMeta);
                        }
                        return [2 /*return*/, packageMetaList];
                }
            });
        });
    };
    DBCommunicator.prototype.injestPackage = function (newPackage, newDescription) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newPackage.metadata.Version = newPackage.metadata.Version.replace(/[vV]/g, '');
                        sql = "INSERT INTO packages (name, package_id, version, zip, js_program, url, description) VALUES(?, ?, ?, ?, ?, ?, ?)";
                        values = [newPackage.metadata.Name, newPackage.metadata.ID, newPackage.metadata.Version, newPackage.data.Content, newPackage.data.JSProgram, newPackage.data.URL, newDescription];
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (typeof (result) == "number" && result == -1) {
                            return [2 /*return*/, -1]; //PACKAGE EXISTS
                        }
                        else if (result == null || result.affectedRows == 0 || typeof (result) == "number") {
                            return [2 /*return*/, 0]; //ANY ERROR
                        }
                        return [2 /*return*/, 1];
                }
            });
        });
    };
    DBCommunicator.prototype.updatePackageById = function (newPackage) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (Schemas.Evaluate.isPackageURL(newPackage.data.URL)) {
                            sql = "UPDATE packages SET url = ? WHERE package_id = ? AND name = ? AND version = ?";
                            values = [newPackage.data.URL, newPackage.metadata.ID, newPackage.metadata.Name, newPackage.metadata.Version];
                        }
                        else if (Schemas.Evaluate.isPackageContent(newPackage.data.Content)) {
                            sql = "UPDATE packages SET zip = ? WHERE package_id = ? AND name = ? AND version = ?";
                            values = [newPackage.data.Content, newPackage.metadata.ID, newPackage.metadata.Name, newPackage.metadata.Version];
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (result == null || result.affectedRows == 0 || typeof (result) == "number") {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    DBCommunicator.prototype.getPackageMetadata = function (packageName, packageVersion) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, _a, major, minor, patch, _b, major, minor, patch, _c, starMajor, startMinor, startPatch, endMajor, endMinor, endPatch, result, packageMetaList, i, packageID, newPackageName, packageMeta;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (packageVersion.includes("~")) {
                            sql = "SELECT * FROM packages WHERE name = ? AND CAST(SUBSTRING_INDEX(version, '.', 1) AS UNSIGNED) = ? AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version, '.', -2), '.', 1) AS UNSIGNED) = ? AND CAST(SUBSTRING_INDEX(version, '.', -1) AS UNSIGNED) >= ?;";
                            _a = packageVersion
                                .replace(/[^\d.^-]/g, '')
                                .split('.')
                                .map(Number), major = _a[0], minor = _a[1], patch = _a[2];
                            values = [packageName, major, minor, patch];
                        }
                        else if (packageVersion.includes("^")) {
                            sql = "SELECT * FROM packages WHERE name = ? AND \n      (\n          CAST(SUBSTRING_INDEX(version, '.', 1) AS UNSIGNED) * 10000 +\n          CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version, '.', -2), '.', 1) AS UNSIGNED) * 100 +\n          CAST(SUBSTRING_INDEX(version, '.', -1) AS UNSIGNED)\n      ) BETWEEN\n          CAST(? AS SIGNED) * 10000 +\n          CAST(? AS SIGNED) * 100 +\n          CAST(? AS SIGNED)\n        AND\n          CAST(? AS SIGNED) * 10000 - 1;";
                            _b = packageVersion
                                .replace(/[^\d.~-]/g, '')
                                .split('.')
                                .map(Number), major = _b[0], minor = _b[1], patch = _b[2];
                            values = [packageName, major, minor, patch, major + 1];
                        }
                        else if (packageVersion.includes("-")) {
                            sql = "SELECT * FROM packages WHERE name = ? AND \n              (\n                  CAST(SUBSTRING_INDEX(version, '.', 1) AS UNSIGNED) * 10000 +\n                  CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version, '.', -2), '.', 1) AS UNSIGNED) * 100 +\n                  CAST(SUBSTRING_INDEX(version, '.', -1) AS UNSIGNED)\n              ) BETWEEN\n                  CAST(? AS SIGNED) * 10000 +\n                  CAST(? AS SIGNED) * 100 +\n                  CAST(? AS SIGNED)\n              AND\n                  CAST(? AS SIGNED) * 10000 +\n                  CAST(? AS SIGNED) * 100 +\n                  CAST(? AS SIGNED);";
                            _c = packageVersion
                                .replace(/[^\d.~^]/g, '.') // Remove non-numeric, ^, ~ characters
                                .split('.')
                                .map(Number), starMajor = _c[0], startMinor = _c[1], startPatch = _c[2], endMajor = _c[3], endMinor = _c[4], endPatch = _c[5];
                            values = [packageName, starMajor, startMinor, startPatch, endMajor, endMinor, endPatch];
                        }
                        else if (packageName == "*") {
                            sql = "SELECT name, package_id, version FROM packages;";
                            values = [packageName, packageVersion];
                        }
                        else {
                            sql = "SELECT name, package_id, version FROM packages WHERE name = ? AND version = ?;";
                            values = [packageName, packageVersion];
                        }
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _d.sent();
                        if (result == null || !Array.isArray(result) || result.length === 0 || typeof (result) == "number") {
                            return [2 /*return*/, []];
                        }
                        packageMetaList = [];
                        for (i = 0; i < result.length; i++) {
                            packageID = result[i].package_id;
                            newPackageName = result[i].name;
                            packageMeta = {
                                Name: newPackageName,
                                Version: result[i].version,
                                ID: packageID
                            };
                            packageMetaList.push(packageMeta);
                        }
                        return [2 /*return*/, packageMetaList];
                }
            });
        });
    };
    DBCommunicator.prototype.getPackageById = function (packageID) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result, packageName, packageMeta, packageData, getPackage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "SELECT name, version, zip, js_program, url FROM packages WHERE package_id = ?";
                        values = [packageID];
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (result == null || !Array.isArray(result) || result.length === 0 || typeof (result) == "number") {
                            return [2 /*return*/, null];
                        }
                        packageName = result[0].name;
                        packageMeta = {
                            Name: packageName,
                            Version: result[0].version,
                            ID: packageID
                        };
                        packageData = {
                            Content: result[0].zip.toString('utf8'),
                            URL: result[0].url,
                            JSProgram: result[0].js_program
                        };
                        getPackage = {
                            metadata: packageMeta,
                            data: packageData
                        };
                        return [2 /*return*/, getPackage];
                }
            });
        });
    };
    DBCommunicator.prototype.deletePackageById = function (packageID) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "DELETE FROM packages WHERE package_id = ?";
                        values = [packageID];
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (result == null || result.affectedRows == 0 || typeof (result) == "number") {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    DBCommunicator.prototype.deletePackageByName = function (packageName) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "DELETE FROM packages WHERE name = ?";
                        values = [packageName];
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (result == null || result.affectedRows == 0 || typeof (result) == "number") {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    DBCommunicator.prototype.getPackageRatings = function (packageID) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result, metrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "SELECT bus_factor, correctness, ramp_up, responsive_maintainer, license_score, good_pinning_practice, pull_request, net_score FROM packages WHERE package_id = ?";
                        values = [packageID];
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (result == null || !Array.isArray(result) || result.length === 0 || typeof (result) == "number") {
                            return [2 /*return*/, null];
                        }
                        metrics = {
                            BusFactor: result[0].bus_factor.toFixed(5),
                            Correctness: result[0].correctness.toFixed(5),
                            RampUp: result[0].ramp_up.toFixed(5),
                            ResponsiveMaintainer: result[0].responsive_maintainer.toFixed(5),
                            LicenseScore: result[0].license_score.toFixed(5),
                            GoodPinningPractice: result[0].good_pinning_practice.toFixed(5),
                            PullRequest: result[0].pull_request.toFixed(5),
                            NetScore: result[0].net_score.toFixed(5)
                        };
                        return [2 /*return*/, metrics];
                }
            });
        });
    };
    DBCommunicator.prototype.injestPackageRatings = function (packageID, metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, values, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "UPDATE packages SET bus_factor = ?, correctness = ?, ramp_up = ?, responsive_maintainer = ?, license_score = ?, good_pinning_practice = ?, pull_request = ?, net_score = ? WHERE package_id = ?";
                        values = [metrics.BusFactor, metrics.Correctness, metrics.RampUp, metrics.ResponsiveMaintainer, metrics.LicenseScore, metrics.GoodPinningPractice, metrics.PullRequest, metrics.NetScore, packageID];
                        return [4 /*yield*/, this.query(sql, values)];
                    case 1:
                        result = _a.sent();
                        if (result == null || result.affectedRows == 0 || typeof (result) == "number") {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Checks if a user is allowed to execute a given SQL query on the connected database.
     * @param userRoleId - The ID of the user trying to query the DB
     * @param queryType - The type of query wanted to execute ONLY ALLOWS ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
     * @param query - The SQL query wanted to execute.
     * @returns A promise that resolves with the a boolean of access permission or false on error.
     */
    /*
    private async checkPermission(userRoleId: number, queryType: string, query: string): Promise<boolean> {
      const sql = 'SELECT COUNT(*) as count FROM permissions WHERE role_id = ? AND (query_type = ? OR (query_type IS NULL AND query = ?))';
      const values = [userRoleId, queryType, query];
      const result : QueryResult | null | number = await this.query(sql, values);
      if (const const result == null || !Array.isArray(result) || result.length === 0 || typeof(result) == number || typeof(result) == number) {
        return false;
      }
      // Query the permissions table to check if the role has permission for the given query type and/or specific query
      return (result as any)[0].count > 0;
    }*/
    /**
     * Authenticates a user with the given username and password.
     * @returns A promise that resolves with the user's permission if the user is authenticated, null otherwise.
     public async authenticateUser(username: string, password: string): Promise<string | null> {
      const sql = 'SELECT user_type FROM users WHERE username = ? AND password = ?';
      const values = [username, password];
      const result : QueryResult | null | number = await this.query(sql, values);
      if (const result == null || !Array.isArray(result) || result.length === 0 || typeof(result) == number) {
        return null;
      }
      return (result[0] as mysql.RowDataPacket).user_type;
    }
     */
    /**
     * Executes a SQL query on the connected database.
     * @param sql - The SQL query to execute.
     * @param values - An array of values to replace placeholders in the SQL query.
     * @returns A promise that resolves with the query results or null on error.
     */
    DBCommunicator.prototype.query = function (sql, values) {
        if (values === void 0) { values = []; }
        return __awaiter(this, void 0, void 0, function () {
            var queryWords, queryTypeToCheck, _a, rows, fields, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.connection) {
                            logger_1.default.error('Database connection not established.'); // replace with logger when we gain access to it
                            return [2 /*return*/, null];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        queryWords = sql.split(' ');
                        queryTypeToCheck = queryWords[0].toUpperCase();
                        return [4 /*yield*/, this.connection.execute(sql, values)];
                    case 2:
                        _a = _b.sent(), rows = _a[0], fields = _a[1];
                        return [2 /*return*/, rows];
                    case 3:
                        error_2 = _b.sent();
                        logger_1.default.error('Database query error:' + error_2); // replace with logger when we gain access to it
                        if (error_2.code == "ER_DUP_ENTRY") {
                            return [2 /*return*/, -1];
                        }
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // creating methods to for testing purposes to allow mocking, 
    // will be overwritten by actual implementations in the future
    /*async injestPackage(packageData: Schemas.Package, readeMe: string): Promise<number> {
      return 0;
    }
    async injestPackageRatings(packageRating: Schemas.PackageRating, packageID: Schemas.PackageID): Promise<boolean> {
      return false;
    }
    async getPackageMetadata(name: Schemas.PackageName, version: Schemas.PackageVersion): Promise<Schemas.PackageMetadata[]> {
      return [];
    }
    async resetRegistry(user: Schemas.User): Promise<boolean> {
      return false;
    }
    async getPackageById(id: Schemas.PackageID): Promise<Schemas.Package | null> {
      return null;
    }
    async updatePackageById(packageData: Schemas.Package): Promise<boolean> {
      return false;
    }
    async deletePackageById(id: Schemas.PackageID): Promise<boolean> {
      return false;
    }
    async getPackageRatings(id: Schemas.PackageID): Promise<Schemas.PackageRating | null> {
      return null;
    }
    async deletePackageByName(name: Schemas.PackageName): Promise<boolean> {
      return false;
    }
    async searchPackagesByRegex(regex: Schemas.PackageRegEx): Promise<Schemas.PackageMetadata[]> {
      return [];
    }
  
    /**
     * Closes the connection to the MySQL database.
     */
    DBCommunicator.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.connection) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connection.end()];
                    case 1:
                        _a.sent();
                        logger_1.default.info('Database connection closed.'); // replace with logger when we gain access to it
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return DBCommunicator;
}());
exports.default = new DBCommunicator();
// EXAMPLE USAGES:
/* Select Data from a Table
    const sql = 'SELECT * FROM your_table';
    const results = await db.query(sql);
    console.log('Query results:', results);
   */
/* Insert Data into a Table
    const insertSql = 'INSERT INTO your_table (column1, column2) VALUES (?, ?)';
    const values = ['value1', 'value2'];
    const insertResult = await db.query(insertSql, values);
    console.log('Insert result:', insertResult);
   */
/* Update Data in a Table
    const updateSql = 'UPDATE your_table SET column1 = ? WHERE column2 = ?';
    const values = ['new_value', 'target_value'];
    const updateResult = await db.query(updateSql, values);
    console.log('Update result:', updateResult);
   */
/* Delete Data from a Table
    const deleteSql = 'DELETE FROM your_table WHERE column = ?';
    const value = 'value_to_delete';
    const deleteResult = await db.query(deleteSql, [value]);
    console.log('Delete result:', deleteResult);
   */
/* Execute Custom Queries
    const customSql = 'SELECT column1, column2 FROM your_table WHERE column3 = ? ORDER BY column4 DESC LIMIT 10';
    const values = ['filter_value'];
    const customQueryResult = await db.query(customSql, values);
    console.log('Custom query result:', customQueryResult);
   */
