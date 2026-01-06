import { CreateCareer, Career, UpdateCareer } from "pases-universitarios";
import { CareerRepository } from "../db/repositories/career-repository";
import { PaginationResponse } from "mimmers-core-nodejs";
import { CareerPaginationRequest } from "@/domain/FilteredPagination";

export class CareerService {
    public static async createCareer(universityId: string, req: CreateCareer): Promise<Career> {
        const career = await CareerRepository.createCareer(universityId, req);
        return career;
    }

    public static async getCareer(universityId: string, code: string): Promise<Career> {
        const career = await CareerRepository.getCareerByCode(universityId, code);
        return career;
    }

    public static async getPaginatedCareers(universityId: string, pRequest: CareerPaginationRequest): Promise<PaginationResponse<Career>> {
        const career = await CareerRepository.getPaginatedCareers(universityId, pRequest);
        return career;
    }

    public static async getCareers(universityId: string): Promise<Career[]> {
        const careers = await CareerRepository.getCareers(universityId);
        return careers;
    }

    public static async updateCareer(universityId: string, code: string, req: UpdateCareer): Promise<Career> {
        const career = await CareerRepository.updateCareer(universityId, code, req);
        return career;
    }
}