import { PackageManagementAPI } from '../../../src/server/server';
import dbCommunicator from '../../../src/dbCommunicator';
import * as Helper from '../../../src/server/server_helper';
import * as Schemas from '../../../src/schemas';
import Evaluate = Schemas.Evaluate;
import { describe, expect, beforeAll, afterAll, jest, it } from '@jest/globals';
import { ValidConstants, InvalidConstants, MockedDBCommunicator,  } from '../testHelper';
import request from 'supertest';
import express from 'express';
import { Server_Error } from '../../../src/server/server_errors';

// Mocking DBCommunicator
jest.mock('../../../src/dbCommunicator');

let apiServer: PackageManagementAPI;
let app: express.Application;

beforeAll(() => {
    dbCommunicator.connect = jest.fn(async () => {});
    dbCommunicator.getPackageMetadata = jest.fn(MockedDBCommunicator.getPackageMetadata);
    dbCommunicator.resetRegistry = jest.fn(MockedDBCommunicator.resetRegistry);
    dbCommunicator.getPackageById = jest.fn(MockedDBCommunicator.getPackageById);
    dbCommunicator.updatePackageById = jest.fn(MockedDBCommunicator.updatePackageById);
    dbCommunicator.deletePackageById = jest.fn(MockedDBCommunicator.deletePackageById);
    dbCommunicator.getPackageRatings = jest.fn(MockedDBCommunicator.getPackageRatings);
    dbCommunicator.deletePackageByName = jest.fn(MockedDBCommunicator.deletePackageByName);
    dbCommunicator.searchPackagesByRegex = jest.fn(MockedDBCommunicator.searchPackagesByRegex);
    
    apiServer = new PackageManagementAPI();
    apiServer.start(8083);
    app = apiServer.getApp();
});

afterAll(async () => {
    await apiServer.close();
    jest.clearAllMocks();
});

describe('/packages', () => {
    // list of packages
    it('should return 200 and not be empty', async () => {
        const response = await request(app).post('/packages').send(ValidConstants.PackageQuerys);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((dataList: Schemas.PackageMetadata[]) => {
            dataList.forEach((packageMetadata: Schemas.PackageMetadata) => {
                expect(Evaluate.isPackageMetadata(packageMetadata)).toBeTruthy();
            });
        });
    });
    it('should return 200 and be empty', async () => {
        const response = await request(app).post('/packages').send(InvalidConstants.UnsuccessfulPackageQuerys);
        expect(response.statusCode).toBe(200);
        response.body.forEach((dataList: Schemas.PackageMetadata[]) => {
            expect(dataList.length).toBe(0);
        });
    });
    // There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.
    // sending individually since entire list is invalid
    it('should return 400', async () => {
        let response: any;
        InvalidConstants.anyList.forEach(async (badPackageQuery) => {
                response = await request(app).post('/packages').send([badPackageQuery]);
            expect(response.statusCode).toBe(400);
        });
    });         
    // too many packages (returned?) TODO
    it.skip('should return 413', async () => {
        
    });
});

// TODO very broken(?) and wonky but i think is working(?)
// testing wonky due to mocks
describe("/package", () => {
    // works when the 409 and 424 tests are skipped and vice versa for each
    // i am learning to not like jest, (probably my fault though :P)
    // jest mocks are broken rn, can't test most of this endpoint
    it.skip('should return 201', async () => {
        ValidConstants.Create.forEach(async (curr, idx) => {
            jest.spyOn(Helper, 'APIHelpPackageContent').mockResolvedValue(ValidConstants.Packages[idx]);
            jest.spyOn(Helper, 'APIHelpPackageURL').mockResolvedValue(ValidConstants.Packages[idx]);
            const response = await request(app).post('/package').send(curr);
            expect(response.statusCode).toBe(201);
        });
    });

    it('should return 400', async () => {
        InvalidConstants.anyList.forEach(async (curr) => {
            const response = await request(app).post('/package').send({curr});
            expect(response.statusCode).toBe(400);
        });
    });

    it.skip('should return 409', async () => {
        ValidConstants.Create.forEach(async (curr) => {
            jest.spyOn(Helper, 'APIHelpPackageContent').mockRejectedValue(new Server_Error(409, "Package already exists"));
            jest.spyOn(Helper, 'APIHelpPackageURL').mockRejectedValue(new Server_Error(409, "Package already exists"));
            const response = await request(app).post('/package').send(curr);
            expect(response.statusCode).toBe(409);
        });
    });

    it.skip('should return 424', async () => {
        ValidConstants.Create.forEach(async (curr) => {
            jest.spyOn(Helper, 'APIHelpPackageContent').mockRejectedValue(new Server_Error(424, "Package is not uploaded due to the disqualified rating."));
            jest.spyOn(Helper, 'APIHelpPackageURL').mockRejectedValue(new Server_Error(424, "Package is not uploaded due to the disqualified rating."));
            const response = await request(app).post('/package').send(curr);
            expect(response.statusCode).toBe(424);
        });
    });

});

describe('/package/byRegEx', () => {
    it('should return 200', async () => {
        ValidConstants.RegEx.forEach(async (curr) => {
            const response = await request(app).post('/package/byRegEx').send({ RegEx: curr });
            expect(response.statusCode).toBe(200);
            response.body.forEach((packageMetadata: Schemas.PackageMetadata) => {
                expect(Evaluate.isPackageMetadata(packageMetadata)).toBeTruthy();
            });
        });
    });
    it('should return 400', async () => {
        ['', null].forEach(async (curr) => {  
            const response = await request(app).post('/package/byRegEx').send({ RegEx: curr });
            expect(response.statusCode).toBe(400);
        });
    });
    it('should return 404', async () => {
        InvalidConstants.UnsuccessfulRegEx.forEach(async (curr) => {
            const response = await request(app).post('/package/byRegEx').send({ RegEx: curr });
            expect(response.statusCode).toBe(404);
        });
    });
});