import { CreateUniversity, University, UpdateUniversity } from "pases-universitarios";
import { UniversityRepository } from "../db/repositories/university-repository";
import { PaginationRequest, PaginationResponse } from "mimmers-core-nodejs";

export class UniversityService {
    public static async createUniversity(req: CreateUniversity): Promise<University> {
        const university = await UniversityRepository.createUniversity(req);
        return university;
    }

    public static async getUniversity(id: string): Promise<University> {
        const university = await UniversityRepository.getUniversityById(id);
        return university;
    }

    public static async getPaginatedUniversities(pRequest: PaginationRequest): Promise<PaginationResponse<University>> {
        const universities = await UniversityRepository.getPaginatedUniversities(pRequest);
        return universities;
    }

    public static async getUniversities(): Promise<University[]> {
        const universities = await UniversityRepository.getUniversities();
        return universities;
    }

    public static async updateUniversity(id: string, req: UpdateUniversity): Promise<University> {
        const university = await UniversityRepository.updateUniversity(id, req);
        return university;
    }
}