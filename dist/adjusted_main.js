"use strict";
/*
This file is part of ECE461Project.

ECE461Projectis free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

ECE461Project is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Foobar. If not, see https://www.gnu.org/licenses/.
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
exports.fetchDataAndCalculateScore = void 0;
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var axios_1 = __importDefault(require("axios"));
var algo_1 = require("./algo");
var dotenv = __importStar(require("dotenv"));
var logger_1 = __importDefault(require("./logger"));
var winston = require('winston'); // Import Winston using CommonJS syntax
var AdmZip = require('adm-zip');
winston.remove(winston.transports.Console); // Remove the default console transport
dotenv.config();
// Check if GITHUB_TOKEN is set and provide a default value if not
if (!process.env.GITHUB_TOKEN) {
    process.exit(1);
}
if (!process.env.LOG_FILE) {
    process.exit(1);
}
var logLevel = parseInt(process.env.LOG_LEVEL); // logLevel is a defined after line 30
// Configure Winston to use a log file and set log level based on environment variables
winston.configure({
    level: logLevel === 0 ? 'error' : (logLevel === 1 ? 'info' : 'debug'), // Default to 'error' if LOG_LEVEL is not set
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: process.env.LOG_FILE }), // Log to a file
    ],
});
var githubToken = process.env.GITHUB_TOKEN;
// Determine the subdirectory name for storing cloned repositories
var localRepositorySubdirectory = 'cloned_repositories';
// Construct the full path to the local repository directory
var localRepositoryDirectory = path.join(__dirname, localRepositorySubdirectory);
// Function to create or clear a directory
function createOrClearDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        var files = fs.readdirSync(directoryPath);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var filePath = path.join(directoryPath, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                // Recursively remove directories
                createOrClearDirectory(filePath);
                fs.rm(filePath, { recursive: true });
            }
            else {
                // Delete files
                fs.unlinkSync(filePath);
            }
        }
    }
    else {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
}
// Function to fetch the number of weekly commits and other required data
function fetchDataAndCalculateScore(inputUrl, content) {
    return __awaiter(this, void 0, void 0, function () {
        var repoUrl, packageName, githubRepo, githubToken, headers, graphqlEndpoint, parsedURL, queries, response, data, lastCommitDate, readmeText, oneWeekAgo, weeklyCommitCount, _i, _a, commit, commitDate, parts, repo, owner, rampUpResult, issues, correctnessScore, busFactorObject, busFactorResult, DependencyFraction, PullRequestFraction, responsiveMaintainerResult, version, licenseCheckResult, netScoreResult, currentDirectory, directoryPath, zipFilePath, base64Zip, zip, gitFolderPath, zipBuffer, output, jsonOutput, error_1, currentDirectory, directoryPath;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    repoUrl = inputUrl;
                    if (!inputUrl.startsWith('https://www.npmjs.com/package/')) return [3 /*break*/, 3];
                    packageName = extractPackageNameFromNpmLink(inputUrl);
                    if (!packageName) return [3 /*break*/, 2];
                    return [4 /*yield*/, getGitHubRepoFromNpm(packageName)];
                case 1:
                    githubRepo = _b.sent();
                    if (githubRepo) {
                        repoUrl = githubRepo;
                    }
                    else {
                        winston.error("Unable to find GitHub repository for npm package \"".concat(packageName, "\""));
                        //   process.exit(1); // Exit with a failure status code (1) on error
                    }
                    return [3 /*break*/, 3];
                case 2:
                    winston.error("Invalid npm package link: \"".concat(inputUrl, "\""));
                    throw new Error("Invalid npm package link: \"".concat(inputUrl, "\""));
                case 3:
                    githubToken = process.env.GITHUB_TOKEN;
                    headers = {
                        Authorization: "Bearer ".concat(githubToken),
                    };
                    graphqlEndpoint = 'https://api.github.com/graphql';
                    // Create or clear the local repository directory
                    createOrClearDirectory(localRepositoryDirectory);
                    winston.info("Processing URL: ".concat(repoUrl));
                    parsedURL = parseGitHubUrl(repoUrl);
                    if (parsedURL == null) {
                        winston.error("Invalid GitHub URL: ".concat(repoUrl));
                        throw new Error("Invalid GitHub URL: ".concat(repoUrl));
                        //  process.exit(1);
                    }
                    queries = "query {\n    repository(owner: \"".concat(parsedURL.owner, "\", name: \"").concat(parsedURL.repoName, "\") {\n      defaultBranchRef {\n        target {\n          ... on Commit {\n            history(first: 1) {\n              edges {\n                node {\n                  committedDate\n                }\n              }\n            }\n          }\n        }\n      }\n      ObjectReadme: object(expression: \"HEAD:Readme.md\") {\n        ... on Blob {\n          text\n        }\n      }\n      ObjectREADME: object(expression: \"HEAD:README.md\") {\n        ... on Blob {\n          text\n        }\n      }\n    }\n  }");
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 12, , 13]);
                    return [4 /*yield*/, axios_1.default.post(graphqlEndpoint, { query: queries }, { headers: headers })];
                case 5:
                    response = _b.sent();
                    if (response.data.errors) {
                        // Log GraphQL query errors
                        winston.error("GraphQL query errors: ".concat(JSON.stringify(response.data.errors)));
                        //process.exit(1); // Exit with a failure status code (1) on error
                        throw new Error("GraphQL query errors: ".concat(JSON.stringify(response.data.errors)));
                    }
                    data = response.data.data;
                    if (!data || !data.repository || !data.repository.defaultBranchRef || !data.repository.defaultBranchRef.target || !data.repository.defaultBranchRef.target.history || !data.repository.defaultBranchRef.target.history.edges || !data.repository.defaultBranchRef.target.history.edges[0] || !data.repository.defaultBranchRef.target.history.edges[0].node || !data.repository.defaultBranchRef.target.history.edges[0].node.committedDate) {
                        winston.error("Error: GraphQL response does not contain the expected data for URL ".concat(repoUrl));
                        //process.exit(1); // Exit with a failure status code (1) on error
                        throw new Error("Error: GraphQL response does not contain the expected data for URL ".concat(repoUrl));
                    }
                    lastCommitDate = new Date(data.repository.defaultBranchRef.target.history.edges[0].node.committedDate);
                    readmeText = data.repository.ObjectReadme ? data.repository.ObjectReadme.text : (data.repository.ObjectREADME ? data.repository.ObjectREADME.text : '');
                    oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    weeklyCommitCount = 0;
                    for (_i = 0, _a = data.repository.defaultBranchRef.target.history.edges; _i < _a.length; _i++) {
                        commit = _a[_i];
                        commitDate = new Date(commit.node.committedDate);
                        if (commitDate >= oneWeekAgo && commitDate <= lastCommitDate) {
                            weeklyCommitCount++;
                        }
                        else {
                            // Break the loop as soon as a commit is older than one week
                            break;
                        }
                    }
                    parts = repoUrl.split('/');
                    repo = parts[parts.length - 1];
                    owner = parts[parts.length - 2];
                    return [4 /*yield*/, (0, algo_1.RampUp)(owner, repo)];
                case 6:
                    rampUpResult = _b.sent();
                    return [4 /*yield*/, fetchAndProcessIssues(repoUrl)];
                case 7:
                    issues = _b.sent();
                    correctnessScore = (0, algo_1.calculateCorrectnessScore)(issues);
                    return [4 /*yield*/, (0, algo_1.calculateBusFactor)(repoUrl, // Replace with the actual repository URL
                        localRepositoryDirectory // Replace with the local directory path
                        )];
                case 8:
                    busFactorObject = _b.sent();
                    busFactorResult = 'busFactor' in busFactorObject ? busFactorObject.busFactor : 0;
                    repoUrl = 'url' in busFactorObject ? busFactorObject.url : repoUrl;
                    return [4 /*yield*/, (0, algo_1.calculatePinnedDependencies)()];
                case 9:
                    DependencyFraction = _b.sent();
                    return [4 /*yield*/, (0, algo_1.calculateCodeReviewFraction)(owner, repo)];
                case 10:
                    PullRequestFraction = _b.sent();
                    responsiveMaintainerResult = (0, algo_1.responsiveMaintainer)(lastCommitDate.getTime());
                    return [4 /*yield*/, (0, algo_1.getGitHubPackageVersion)(owner, repo)];
                case 11:
                    version = _b.sent();
                    licenseCheckResult = (0, algo_1.licenseCheck)(readmeText);
                    winston.debug("Ramp Up Score: ".concat(rampUpResult));
                    winston.debug("Correctness Score: ".concat(correctnessScore));
                    winston.debug("Bus Factor Score: ".concat(busFactorResult));
                    winston.debug("Responsive Maintainer Score: ".concat(responsiveMaintainerResult));
                    winston.debug("Pull Request Fraction: ".concat(PullRequestFraction));
                    winston.debug("Dependency Pin: ".concat(DependencyFraction));
                    winston.debug("License Score: ".concat(licenseCheckResult));
                    netScoreResult = (0, algo_1.netScore)(licenseCheckResult, busFactorResult, responsiveMaintainerResult, correctnessScore, // Include the correctness score
                    rampUpResult, // Use the retrieved weeklyCommits value
                    DependencyFraction, PullRequestFraction);
                    winston.info("NET_SCORE: ".concat(netScoreResult));
                    currentDirectory = __dirname;
                    directoryPath = path.join(currentDirectory, 'cloned_repositories');
                    zipFilePath = path.join(currentDirectory, "".concat(repo, ".zip"));
                    base64Zip = content;
                    if ((base64Zip === undefined || base64Zip === null) && fs.existsSync(directoryPath)) {
                        try {
                            zip = new AdmZip();
                            gitFolderPath = "".concat(directoryPath, "/.git");
                            if (fs.existsSync(gitFolderPath)) {
                                fs.rmdirSync(gitFolderPath, { recursive: true });
                            }
                            // Add the entire directory to the zip file
                            addFolderToZip(directoryPath, zip);
                            zipBuffer = zip.toBuffer();
                            // Convert the buffer to a base64-encoded string
                            base64Zip = zipBuffer.toString('base64');
                            // Now you can remove the directory
                            try {
                                fs.rmdirSync(directoryPath, { recursive: true });
                            }
                            catch (err) {
                                logger_1.default.info("Error removing directory ".concat(directoryPath, ": ").concat(err));
                            }
                            // Return the base64-encoded string
                        }
                        catch (err) {
                            logger_1.default.info("Error creating zip file: ".concat(err));
                            fs.rmdirSync(directoryPath, { recursive: true });
                            // Return an appropriate value or handle the error as needed
                        }
                    }
                    else {
                        try {
                            fs.rmdirSync(directoryPath, { recursive: true });
                        }
                        catch (err) {
                            logger_1.default.info("Error removing directory ".concat(directoryPath, ": ").concat(err));
                        }
                    }
                    output = {
                        ratings: {
                            BusFactor: parseFloat(busFactorResult.toFixed(5)),
                            Correctness: parseFloat(correctnessScore.toFixed(5)),
                            RampUp: parseFloat(rampUpResult.toFixed(5)),
                            ResponsiveMaintainer: parseFloat(responsiveMaintainerResult.toFixed(5)),
                            LicenseScore: parseFloat(licenseCheckResult.toFixed(5)),
                            GoodPinningPractice: parseFloat(DependencyFraction.toFixed(5)),
                            PullRequest: parseFloat(PullRequestFraction.toFixed(5)), // TODO
                            NetScore: parseFloat(netScoreResult.toFixed(5)),
                        },
                        url: repoUrl,
                        content: base64Zip,
                        version: version,
                        reademe: readmeText
                    };
                    jsonOutput = JSON.stringify(output);
                    /**
                    const parts = repositoryUrl.split('/');
                    const owner = parts[parts.length - 2];
                    const repo = parts[parts.length - 1];
                     */
                    // Log the JSON output
                    return [2 /*return*/, output];
                case 12:
                    error_1 = _b.sent();
                    currentDirectory = __dirname;
                    directoryPath = path.join(currentDirectory, 'cloned_repositories');
                    if (fs.existsSync(directoryPath)) {
                        try {
                            // Remove the directory
                            fs.removeSync(directoryPath);
                        }
                        catch (err) {
                            logger_1.default.info("Error removing directory ".concat(directoryPath, ": ").concat(err));
                        }
                    }
                    winston.error("Error processing URL ".concat(repoUrl, ": ").concat(error_1));
                    //process.exit(1); // Exit with a failure status code (1) on error
                    throw new Error("Error processing URL ".concat(repoUrl, ": ").concat(error_1));
                case 13: return [2 /*return*/];
            }
        });
    });
}
exports.fetchDataAndCalculateScore = fetchDataAndCalculateScore;
function addFolderToZip(folderPath, zip) {
    var files = fs.readdirSync(folderPath);
    files.forEach(function (file) {
        var filePath = path.join(folderPath, file);
        var stats = fs.lstatSync(filePath);
        if (stats.isDirectory()) {
            addFolderToZip(filePath, zip);
        }
        else if (stats.isFile()) {
            zip.addLocalFile(filePath);
        }
        // Ignore symbolic links
    });
}
// Define a function to parse GitHub repository URL
function parseGitHubUrl(url) {
    var githubRegex = /github\.com\/([^/]+)\/([^/]+)/;
    var match = url.match(githubRegex);
    if (match && match.length === 3) {
        var owner = match[1];
        var repoName = match[2];
        return { owner: owner, repoName: repoName };
    }
    else {
        return null;
    }
}
// Define a function to fetch and process issues data from the repository
function fetchAndProcessIssues(repositoryUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var parts, owner, repo, response, issues, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    parts = repositoryUrl.split('/');
                    owner = parts[parts.length - 2];
                    repo = parts[parts.length - 1];
                    return [4 /*yield*/, axios_1.default.get("https://api.github.com/repos/".concat(owner, "/").concat(repo, "/issues"))];
                case 1:
                    response = _a.sent();
                    issues = response.data.map(function (issue) { return ({
                        isBug: issue.labels.some(function (label) { return label.name === 'bug'; }),
                        status: issue.state,
                    }); });
                    return [2 /*return*/, issues];
                case 2:
                    error_2 = _a.sent();
                    return [2 /*return*/, []]; // Return an empty array in case of an error
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Function to extract the npm package name from an npm link
function extractPackageNameFromNpmLink(npmLink) {
    var npmLinkRegex = /www\.npmjs\.com\/package\/([^/]+)/;
    var match = npmLink.match(npmLinkRegex);
    if (match && match.length === 2) {
        return match[1];
    }
    else {
        return null;
    }
}
// Function to fetch GitHub repository information from an npm package name
function getGitHubRepoFromNpm(packageName) {
    return __awaiter(this, void 0, void 0, function () {
        var response, packageData, repositoryUrl, githubUrl, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get("https://registry.npmjs.org/".concat(packageName))];
                case 1:
                    response = _a.sent();
                    packageData = response.data;
                    if (packageData.repository && packageData.repository.url) {
                        repositoryUrl = packageData.repository.url;
                        githubUrl = repositoryUrl.replace(/^git\+/, '').replace(/\.git$/, '');
                        return [2 /*return*/, githubUrl];
                    }
                    return [2 /*return*/, null];
                case 2:
                    error_3 = _a.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
