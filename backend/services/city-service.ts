import { CreateCity, City, UpdateCity } from "pases-universitarios";
import { CityRepository } from "../db/repositories/city-repository";
import { PaginationRequest, PaginationResponse } from "mimmers-core-nodejs";

export class CityService {
    public static async createCity(universityId: string, req: CreateCity): Promise<City> {
        const city = await CityRepository.createCity(universityId, req);
        return city;
    }

    public static async createMany(universityId: string, req: CreateCity[]): Promise<number> {
        const count = await CityRepository.createMany(universityId, req);
        return count;
    }

    public static async getCity(universityId: string, code: string): Promise<City> {
        const city = await CityRepository.getCityByCode(universityId, code);
        return city;
    }

    public static async getPaginatedCities(universityId: string, pRequest: PaginationRequest): Promise<PaginationResponse<City>> {
        const cities = await CityRepository.getPaginatedCities(universityId, pRequest);
        return cities;
    }

    public static async getCities(universityId: string): Promise<City[]> {
        const cities = await CityRepository.getCities(universityId);
        return cities;
    }

    public static async updateCity(universityId: string, code: string, req: UpdateCity): Promise<City> {
        const city = await CityRepository.updateCity(universityId, code, req);
        return city;
    }
}