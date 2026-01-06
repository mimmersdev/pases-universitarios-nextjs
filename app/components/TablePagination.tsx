import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
  currentPage: number; // 0-indexed page number
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[]; // Optional: custom page size options
  showSelectedRows?: boolean; // Optional: show selected rows count
  selectedRowsCount?: number; // Optional: number of selected rows
  totalRows?: number; // Optional: total number of rows
}

const DataTablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 25, 30, 40, 50],
  showSelectedRows = false,
  selectedRowsCount = 0,
  totalRows = 0,
}: DataTablePaginationProps) => {
  const canPreviousPage = currentPage > 0;
  const canNextPage = currentPage < totalPages - 1;
  const displayPage = currentPage + 1; // Display as 1-indexed

  const handleFirstPage = () => {
    onPageChange(0);
  };

  const handlePreviousPage = () => {
    if (canPreviousPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (canNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    onPageChange(totalPages - 1);
  };

  return (
    <div className="flex items-center justify-between px-2 mt-4">
      {showSelectedRows && selectedRowsCount !== undefined && totalRows !== undefined && (
        <div className="text-muted-foreground flex-1 text-sm">
          {selectedRowsCount} de {totalRows} fila(s) seleccionada(s).
        </div>
      )}
      {!showSelectedRows && <div className="flex-1" />}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas por página</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {displayPage} de {totalPages || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={handleFirstPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Ir a la primera página</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={handlePreviousPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Ir a la página anterior</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={handleNextPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">Ir a la página siguiente</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={handleLastPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">Ir a la última página</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTablePagination;