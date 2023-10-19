/*************************************************
 * 
 * Ideas:
 * 1. DataBase Communicator Object?
 * 2. Handle all API Computations. API should only handle responses nothing else.
 * 3. 
 * 
 * ************************************************** */
import * as fs from 'fs';
import {fetchDataAndCalculateScore} from './adjusted_main'
const { Buffer } = require('buffer');
const AdmZip = require('adm-zip');

interface CLIOutput {
    'URL': string;
    'NET_SCORE': number;
    'RAMP_UP_SCORE': number;
    'CORRECTNESS_SCORE': number;
    'BUS_FACTOR_SCORE': number;
    'RESPONSIVE_MAINTAINER_SCORE': number;
    'LICENSE_SCORE': number;
    [key: string]: number | string;
  }


export function APIHelpPackageContent(base64: string, JsProgram: string) {
    const zipBuffer: Buffer = Buffer.from(base64, 'base64');
    const unzipDir = './temp';

    if (!fs.existsSync(unzipDir)) {
        fs.mkdirSync(unzipDir);
    }

    try {
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();

        zipEntries.forEach((entry: any) => {
            // Ensure that the entry is a file, not a directory
            if (!entry.isDirectory) {
                const entryName = entry.entryName;
                const entryData = entry.getData();
                const outputPath = `${unzipDir}/${entryName}`;

                // Create subdirectories if they don't exist
                const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                // Write the entry data to the corresponding file
                fs.writeFileSync(outputPath, entryData);
                console.log(`Extracted: ${entryName}`);
            }
        });
        console.log('ZIP file extraction complete.');

        return {blah: "This is a filler"}
    } catch (error) {

        console.error('Error processing the ZIP file:', error);

        return {blah: "This is a filler"}
    }
}

export async function APIHelpPackageURL(url: string, JsProgram:string){
    const error_response: object = {error: 'Package is not uploaded due to the disqualified rating.'}
    try {
        const result: CLIOutput = await fetchDataAndCalculateScore(url);

        //Check to see if Scores Fulfill the threshold if not return a different return code
        // Believe they all have to be over 0.5
        const keys: string[] = Object.keys(result)
        for(const key of keys) {
            const value = result[key as keyof CLIOutput];
            if(typeof value === 'number' && value < 0.5){
                return error_response
            }
        }

        //Put in logic to store package in database and download as zipfile
        //Check if already in database too should be something like:
        // upload = DataBaseManager.InsertFromUrl(url, result)
        // upload includes data for success_response or error
        // if error in upload: {return alread_exists_response} else{} do whats below
        const success_response = {
            "metadata": {
              "Name": "Underscore",
              "Version": "1.0.0",
              "ID": "underscore"
            },
            "data": {
              "Content": "Base64 of zipfile"}
            }

        return success_response
    //res.status(201).json(newPackage);
    } catch (error) {
        console.error('Error in fetchDataAndCalculateScore:', error);
        const error_response = {
            error : "Invalid package format. Please ensure the package meets the required format."
        }
        return error_response
    }
}