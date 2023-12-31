/*
This file is part of ECE461Project.

ECE461Projectis free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

ECE461Project is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Foobar. If not, see https://www.gnu.org/licenses/. 
*/

import * as path from 'path';
import * as fs from 'fs-extra';
import axios from 'axios';
import { calculateBusFactor, netScore, responsiveMaintainer, licenseCheck, calculateCorrectnessScore, RampUp,  calculatePinnedDependencies, calculateCodeReviewFraction, getGitHubPackageVersion} from './algo';
import { getInfo, processUrls } from './parser';
import * as dotenv from 'dotenv'
import { json } from 'node:stream/consumers';
import { exit } from 'process';
import * as Schemas from './schemas';
import logger from './logger';
const winston = require('winston'); // Import Winston using CommonJS syntax
const AdmZip = require('adm-zip');
winston.remove(winston.transports.Console); // Remove the default console transport
dotenv.config();

// Check if GITHUB_TOKEN is set and provide a default value if not
if (!process.env.GITHUB_TOKEN) {
  process.exit(1);
}

if (!process.env.LOG_FILE) {
  process.exit(1);
}

const logLevel = parseInt(process.env.LOG_LEVEL as string); // logLevel is a defined after line 30


// Configure Winston to use a log file and set log level based on environment variables
winston.configure({
  level: logLevel === 0 ? 'error' : (logLevel === 1 ? 'info' : 'debug'), // Default to 'error' if LOG_LEVEL is not set
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE }), // Log to a file
  ],
});

const githubToken = process.env.GITHUB_TOKEN;


// Determine the subdirectory name for storing cloned repositories
const localRepositorySubdirectory = 'cloned_repositories';

// Construct the full path to the local repository directory
const localRepositoryDirectory = path.join(__dirname, localRepositorySubdirectory);

// Function to create or clear a directory
function createOrClearDirectory(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        // Recursively remove directories
        createOrClearDirectory(filePath);
        fs.rm(filePath, { recursive: true })
      } else {
        // Delete files
        fs.unlinkSync(filePath);
      }
    }
  } else {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

// Function to fetch the number of weekly commits and other required data
export async function fetchDataAndCalculateScore(inputUrl: string, content?: Schemas.PackageContent): Promise<Schemas.DataFetchedFromURL> {
  let repoUrl = inputUrl;

  // Check if the input URL is an npm package link and try to get the corresponding GitHub repo
  if (inputUrl.startsWith('https://www.npmjs.com/package/')) {
    const packageName = extractPackageNameFromNpmLink(inputUrl);

    if (packageName) {
      const githubRepo = await getGitHubRepoFromNpm(packageName);

      if (githubRepo) {
        repoUrl = githubRepo;
      } else {
        winston.error(`Unable to find GitHub repository for npm package "${packageName}"`);
     //   process.exit(1); // Exit with a failure status code (1) on error
      }
    } else {
      winston.error(`Invalid npm package link: "${inputUrl}"`);
      throw new Error(`Invalid npm package link: "${inputUrl}"`);
     // process.exit(1); // Exit with a failure status code (1) on error
    }
  }
  // Define your GitHub Personal Access Token
  const githubToken = process.env.GITHUB_TOKEN; // Replace with your GitHub token

  // Define headers with the authorization token
  const headers = {
    Authorization: `Bearer ${githubToken}`,
  };
  // Define the GraphQL endpoint URL
  const graphqlEndpoint = 'https://api.github.com/graphql';

  // Create or clear the local repository directory
  createOrClearDirectory(localRepositoryDirectory);
  winston.info(`Processing URL: ${repoUrl}`);

  const parsedURL = parseGitHubUrl(repoUrl);
  if(parsedURL == null) {
    winston.error(`Invalid GitHub URL: ${repoUrl}`);
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  //  process.exit(1);
  }
  

  // Read GraphQL queries from queries.txt
  const queries =
    `query {
    repository(owner: "${parsedURL.owner}", name: "${parsedURL.repoName}") {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 1) {
              edges {
                node {
                  committedDate
                }
              }
            }
          }
        }
      }
      ObjectReadme: object(expression: "HEAD:Readme.md") {
        ... on Blob {
          text
        }
      }
      ObjectREADME: object(expression: "HEAD:README.md") {
        ... on Blob {
          text
        }
      }
    }
  }`;

  try {
    const response = await axios.post(
      graphqlEndpoint,
      { query: queries },
      { headers }
    );
    if (response.data.errors) {
      // Log GraphQL query errors
      winston.error(`GraphQL query errors: ${JSON.stringify(response.data.errors)}`);
      //process.exit(1); // Exit with a failure status code (1) on error
      throw new Error(`GraphQL query errors: ${JSON.stringify(response.data.errors)}`);
      
    }
    const data = response.data.data;
    if (!data || !data.repository || !data.repository.defaultBranchRef || !data.repository.defaultBranchRef.target || !data.repository.defaultBranchRef.target.history || !data.repository.defaultBranchRef.target.history.edges || !data.repository.defaultBranchRef.target.history.edges[0] || !data.repository.defaultBranchRef.target.history.edges[0].node || !data.repository.defaultBranchRef.target.history.edges[0].node.committedDate) {
      winston.error(`Error: GraphQL response does not contain the expected data for URL ${repoUrl}`);
      //process.exit(1); // Exit with a failure status code (1) on error
      throw new Error(`Error: GraphQL response does not contain the expected data for URL ${repoUrl}`);
    }

    // Extract the necessary data from the GraphQL response
    const lastCommitDate = new Date(data.repository.defaultBranchRef.target.history.edges[0].node.committedDate);
    const readmeText = data.repository.ObjectReadme ? data.repository.ObjectReadme.text : (data.repository.ObjectREADME ? data.repository.ObjectREADME.text : '');
    // Calculate the date one week ago from the current date
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Count the number of commits within the past week
    let weeklyCommitCount = 0;
    for (const commit of data.repository.defaultBranchRef.target.history.edges) {
      const commitDate = new Date(commit.node.committedDate);
      if (commitDate >= oneWeekAgo && commitDate <= lastCommitDate) {
        weeklyCommitCount++;
      } else {
        // Break the loop as soon as a commit is older than one week
        break;
      }
    }
    const parts = repoUrl.split('/');
    const repo = parts[parts.length - 1];
    const owner = parts[parts.length -2];
    const rampUpResult = await RampUp(owner, repo);
    // Fetch and process issues data
    const issues = await fetchAndProcessIssues(repoUrl);

    // Calculate the "correctness" score
    const correctnessScore = calculateCorrectnessScore(issues);
    // Process the data using your algo functions
    const busFactorObject = await calculateBusFactor(
      repoUrl, // Replace with the actual repository URL
      localRepositoryDirectory // Replace with the local directory path
    );
    const busFactorResult: number = 'busFactor' in busFactorObject ?  busFactorObject.busFactor as number : 0
    repoUrl ='url' in  busFactorObject? busFactorObject.url as string : repoUrl;
    const DependencyFraction = await calculatePinnedDependencies();
    const PullRequestFraction = await calculateCodeReviewFraction(owner,repo);
    const responsiveMaintainerResult = responsiveMaintainer(
      lastCommitDate.getTime()
    );
    const version = await getGitHubPackageVersion(owner, repo);

    const licenseCheckResult = licenseCheck(readmeText);
    
    winston.debug(`Ramp Up Score: ${rampUpResult}`);
    winston.debug(`Correctness Score: ${correctnessScore}`);
    winston.debug(`Bus Factor Score: ${busFactorResult}`);
    winston.debug(`Responsive Maintainer Score: ${responsiveMaintainerResult}`);
    winston.debug(`Pull Request Fraction: ${PullRequestFraction}`);
    winston.debug(`Dependency Pin: ${DependencyFraction}`);
    winston.debug(`License Score: ${licenseCheckResult}`);

    // Calculate the net score using your netScore function
    const netScoreResult = netScore(
      licenseCheckResult,
      busFactorResult,
      responsiveMaintainerResult,
      correctnessScore, // Include the correctness score
      rampUpResult, // Use the retrieved weeklyCommits value
      DependencyFraction,
      PullRequestFraction
      );
    winston.info(`NET_SCORE: ${netScoreResult}`);
  
    // Return the result for NDJSON formatting
    const currentDirectory = __dirname;
    const directoryPath = path.join(currentDirectory, 'cloned_repositories');
    const zipFilePath = path.join(currentDirectory, `${repo}.zip`);
    let base64Zip = content
    if ((base64Zip === undefined || base64Zip === null) && fs.existsSync(directoryPath)) {
      try {
          // Create a new instance of AdmZip
          const zip: typeof AdmZip = new AdmZip();
          const gitFolderPath = `${directoryPath}/.git`;
          if (fs.existsSync(gitFolderPath)) {
            fs.rmdirSync(gitFolderPath, { recursive: true });
          }
          // Add the entire directory to the zip file
          addFolderToZip(directoryPath, zip);
          //zip.writeZip(zipFilePath);
          // Get the zip file as a buffer
          const zipBuffer = zip.toBuffer();
  
          // Convert the buffer to a base64-encoded string
          base64Zip = zipBuffer.toString('base64');
  
          // Now you can remove the directory
          try {
              fs.rmdirSync(directoryPath, { recursive: true });
          } catch (err) {
              logger.info(`Error removing directory ${directoryPath}: ${err}`);
          }
  
          // Return the base64-encoded string
      } catch (err) {
          logger.info(`Error creating zip file: ${err}`);
          fs.rmdirSync(directoryPath, { recursive: true });
          // Return an appropriate value or handle the error as needed
      }
    }  
    else{
      try {
        fs.rmdirSync(directoryPath, { recursive: true });
      } catch (err) {
          logger.info(`Error removing directory ${directoryPath}: ${err}`);
      }
    }

    const output: Schemas.DataFetchedFromURL = {
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
    // Serialize the output to JSON
    const jsonOutput = JSON.stringify(output);
    /**
    const parts = repositoryUrl.split('/');
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];
     */
    // Log the JSON output
    return output
  } catch (error) {
    const currentDirectory = __dirname;
    const directoryPath = path.join(currentDirectory, 'cloned_repositories');
    if (fs.existsSync(directoryPath)) {
        try {
          // Remove the directory
          fs.removeSync(directoryPath);
        } catch (err) {
          logger.info(`Error removing directory ${directoryPath}: ${err}`);
        }
      }
    winston.error(`Error processing URL ${repoUrl}: ${error}`);
    //process.exit(1); // Exit with a failure status code (1) on error
    throw new Error(`Error processing URL ${repoUrl}: ${error}`);
    
  }
}

function addFolderToZip(folderPath: string, zip: typeof AdmZip): void {
  const files: string[] = fs.readdirSync(folderPath);
  files.forEach((file: string) => {
      const filePath: string = path.join(folderPath, file);
      const stats: fs.Stats = fs.lstatSync(filePath);

      if (stats.isDirectory()) {
          addFolderToZip(filePath, zip);
      } else if (stats.isFile()) {
          zip.addLocalFile(filePath);
      }
      // Ignore symbolic links
  });
}


// Define a function to parse GitHub repository URL
function parseGitHubUrl(url : string) : { owner: string, repoName: string } | null {
  const githubRegex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = url.match(githubRegex);

  if (match && match.length === 3) {
    const owner = match[1];
    const repoName = match[2];
    return { owner, repoName };
  } else {
    return null;
  }
}

// Define a function to fetch and process issues data from the repository
async function fetchAndProcessIssues(repositoryUrl: string) {
  try {
    // Assuming your GitHub repository URL is in the format "https://github.com/owner/repo"
    const parts = repositoryUrl.split('/');
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];

    // Fetch issues from the GitHub REST API
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`);

    // Process the issues and return an array of Issue objects
    const issues = response.data.map((issue: any) => ({
      isBug: issue.labels.some((label: any) => label.name === 'bug'),
      status: issue.state,
    }));

    return issues;
  } catch (error) {
    return []; // Return an empty array in case of an error
  }
}


// Function to extract the npm package name from an npm link
function extractPackageNameFromNpmLink(npmLink: string): string | null {
  const npmLinkRegex = /www\.npmjs\.com\/package\/([^/]+)/;
  const match = npmLink.match(npmLinkRegex);

  if (match && match.length === 2) {
    return match[1];
  } else {
    return null;
  }
}

// Function to fetch GitHub repository information from an npm package name
async function getGitHubRepoFromNpm(packageName: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const packageData = response.data;

    if (packageData.repository && packageData.repository.url) {
      // Extract the GitHub repository URL from the npm package data
      const repositoryUrl = packageData.repository.url;
      // Convert the npm-specific URL to a GitHub URL
      const githubUrl = repositoryUrl.replace(/^git\+/, '').replace(/\.git$/, '');
      return githubUrl;
    }
    return null;
  } catch (error) {
    return null;
  }
}
