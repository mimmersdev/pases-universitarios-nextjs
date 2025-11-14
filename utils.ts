import * as XLSX from "xlsx";

export type ExcelDataType = "string" | "number" | "boolean" | "date";

export type ExcelFieldDefinition = {
    title: string;
    type: ExcelDataType;
    description?: string;
    validValues?: string[];
    example?: string;
};

/**
 * Converts a cell value based on the expected field type
 */
function convertCellValue(
    value: any,
    fieldType: ExcelDataType,
    fieldName: string,
    rowIndex: number
): any {
    if (value === null || value === undefined || value === '') {
        return value;
    }

    switch (fieldType) {
        case 'number': {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value));
            if (isNaN(numValue)) {
                throw new Error(`Fila ${rowIndex + 2}, columna "${fieldName}": valor no numérico válido`);
            }
            return numValue;
        }
        case 'boolean': {
            const strValue = String(value).toLowerCase().trim();
            if (strValue === 'true' || strValue === '1' || strValue === 'sí' || strValue === 'yes') {
                return true;
            } else if (strValue === 'false' || strValue === '0' || strValue === 'no') {
                return false;
            } else {
                throw new Error(`Fila ${rowIndex + 2}, columna "${fieldName}": valor booleano inválido (use true/false)`);
            }
        }
        case 'date': {
            // Excel dates come as numbers, convert to ISO string
            if (typeof value === 'number') {
                // Excel date serial number (epoch is December 30, 1899)
                const excelEpoch = new Date(1899, 11, 30);
                const date = new Date(excelEpoch.getTime() + value * 86400000);
                return date.toISOString();
            } else {
                // Try to parse as date string
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new Error(`Fila ${rowIndex + 2}, columna "${fieldName}": fecha inválida`);
                }
                return date.toISOString();
            }
        }
        case 'string':
        default:
            return String(value);
    }
}

/**
 * Parses an Excel file (ArrayBuffer) and converts it to an array of objects
 * based on the provided field definitions.
 * 
 * @param arrayBuffer - The Excel file as an ArrayBuffer
 * @param fieldDefinitions - Array of field definitions that describe the expected columns
 * @returns Array of objects with converted values
 * @throws Error if the file cannot be parsed or data is invalid
 */
export function parseExcelFile(
    arrayBuffer: ArrayBuffer,
    fieldDefinitions: ExcelFieldDefinition[]
): any[] {
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error("El archivo Excel no contiene hojas de cálculo");
    }
    
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON (array of arrays)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use array format to preserve order
        defval: null // Default value for empty cells
    });
    
    if (!Array.isArray(jsonData) || jsonData.length < 2) {
        throw new Error("El archivo Excel debe contener al menos una fila de encabezados y una fila de datos");
    }
    
    // First row is headers
    const headers = jsonData[0] as string[];
    if (!headers || headers.length === 0) {
        throw new Error("El archivo Excel no contiene encabezados válidos");
    }
    
    // Create a map of header name to field definition for quick lookup
    const fieldMap = new Map<string, ExcelFieldDefinition>();
    fieldDefinitions.forEach(field => {
        fieldMap.set(field.title, field);
    });
    
    // Convert rows to objects
    const dataRows = jsonData.slice(1) as any[][];
    const convertedData = dataRows
        .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')) // Filter empty rows
        .map((row, rowIndex) => {
            const obj: any = {};
            headers.forEach((header, colIndex) => {
                if (header) {
                    let value = row[colIndex];
                    
                    // Get field definition for this header
                    const fieldInfo = fieldMap.get(header);
                    if (fieldInfo) {
                        // Convert value based on field type
                        value = convertCellValue(value, fieldInfo.type, header, rowIndex);
                    }
                    
                    obj[header] = value;
                }
            });
            return obj;
        });
    
    return convertedData;
}

