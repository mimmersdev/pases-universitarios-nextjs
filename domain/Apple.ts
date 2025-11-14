export interface AppleDeviceRegistrationRequest {
    serialNumber: string;
    universityId: string;
    uniqueIdentifier: string;
    careerId: string;
    deviceLibraryIdentifier: string;
    passTypeIdentifier: string;
    pushToken: string;
}

export interface AppleDeviceRegistration {
    universityId: string;
    uniqueIdentifier: string;
    careerId: string;
    deviceLibraryIdentifier: string;
    passTypeIdentifier: string;
    serialNumber: string;
    pushToken: string;
    createdAt: Date;
    updatedAt: Date;
}