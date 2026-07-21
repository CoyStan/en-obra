import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  MessageCircleIcon,
  MoreVerticalIcon,
  ArrowUpDownIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Material, Project, Supplier } from "../../../src/tracker/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  attentionState,
  deliveryDateLine,
  deliverySubLabel,
  estadoChip,
  materialInitial,
  openWhatsApp,
  paymentLabels,
  statusLabel,
  supplierFor,
} from "@/dashboard/model";

type MaterialsDataTableProps = {
  items: Material[];
  suppliers: Supplier[];
  /** Projects used to resolve each material's job (and WhatsApp targets). */
  projects: Project[];
  /** When set, footer tip uses this job; otherwise first matching item's project. */
  project?: Project;
  showProjectColumn?: boolean;
  onEdit: (material: Material) => void;
  onOpenProject?: (projectId: string) => void;
};

function formatMoney(cents: number) {
  if (!cents) {
    return "—";
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function entregaToneClass(material: Material) {
  const state = attentionState(material);
  if (state === "late") return "text-destructive";
  if (state === "complete") return "text-primary";
  if (state === "today") return "text-foreground";
  return "text-muted-foreground";
}

function tryOpenWhatsApp(phone: string | undefined, text: string, missingMessage: string) {
  if (!openWhatsApp(phone, text)) {
    toast.error(missingMessage);
  }
}

function SortableHeader({
  label,
  sorted,
  onSort,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onSort: () => void;
}) {
  return (
    <Button className="-ml-2 h-8 px-2" onClick={onSort} size="sm" variant="ghost">
      {label}
      <ArrowUpDownIcon className={sorted ? "text-foreground" : "text-muted-foreground"} />
    </Button>
  );
}

export function MaterialsDataTable({
  items,
  suppliers,
  projects,
  project,
  showProjectColumn = false,
  onEdit,
  onOpenProject,
}: MaterialsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const projectById = useMemo(() => {
    const map = new Map(projects.map((entry) => [entry.id, entry]));
    return map;
  }, [projects]);

  const tipProject = project ?? projects.find((entry) => entry.id === items[0]?.projectId) ?? projects[0];

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    if (statusFilter === "late") {
      return items.filter((material) => attentionState(material) === "late");
    }
    return items.filter((material) => material.status === statusFilter);
  }, [items, statusFilter]);

  const columns = useMemo<ColumnDef<Material>[]>(
    () => {
      const defs: ColumnDef<Material>[] = [
        {
          accessorKey: "name",
          header: ({ column }) => (
            <SortableHeader
              label="Material"
              onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
              sorted={column.getIsSorted()}
            />
          ),
          cell: ({ row }) => {
            const material = row.original;
            return (
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
                    {materialInitial(material.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">{material.name}</span>
                  <span className="text-xs text-muted-foreground">{material.quantity}</span>
                </div>
              </div>
            );
          },
          filterFn: (row, _id, value: string) => {
            const material = row.original;
            const supplier = supplierFor(suppliers, material.supplierId);
            const job = projectById.get(material.projectId);
            const haystack =
              `${material.name} ${material.quantity} ${supplier?.name ?? ""} ${supplier?.category ?? ""} ${job?.name ?? ""} ${job?.clientName ?? ""}`.toLowerCase();
            return haystack.includes(value.toLowerCase());
          },
        },
      ];

      if (showProjectColumn) {
        defs.push({
          id: "project",
          accessorFn: (row) => projectById.get(row.projectId)?.name ?? "",
          header: ({ column }) => (
            <SortableHeader
              label="Trabajo"
              onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
              sorted={column.getIsSorted()}
            />
          ),
          cell: ({ row }) => {
            const job = projectById.get(row.original.projectId);
            if (!job) {
              return <span className="text-muted-foreground">—</span>;
            }
            return (
              <button
                className="flex max-w-[12rem] flex-col items-start gap-0.5 text-left hover:underline"
                onClick={() => onOpenProject?.(job.id)}
                type="button"
              >
                <span className="truncate font-medium">{job.name}</span>
                <span className="truncate text-xs text-muted-foreground">{job.clientName}</span>
              </button>
            );
          },
        });
      }

      defs.push(
        {
          id: "supplier",
          accessorFn: (row) => supplierFor(suppliers, row.supplierId)?.name ?? "",
          header: ({ column }) => (
            <SortableHeader
              label="Proveedor"
              onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
              sorted={column.getIsSorted()}
            />
          ),
          cell: ({ row }) => {
            const supplier = supplierFor(suppliers, row.original.supplierId);
            return (
              <div className="flex flex-col items-start gap-1.5">
                <span>{supplier?.name ?? "Sin proveedor"}</span>
                {supplier?.category ? (
                  <Badge variant="secondary">{supplier.category}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Asignar proveedor</span>
                )}
              </div>
            );
          },
        },
        {
          id: "delivery",
          accessorFn: (row) => row.expectedOn ?? row.receivedOn ?? "",
          header: ({ column }) => (
            <SortableHeader
              label="Entrega"
              onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
              sorted={column.getIsSorted()}
            />
          ),
          cell: ({ row }) => {
            const material = row.original;
            const tone = entregaToneClass(material);
            return (
              <div className="flex flex-col gap-0.5">
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${tone}`}>
                  <CalendarIcon className="size-3.5 shrink-0" />
                  {deliveryDateLine(material)}
                </span>
                <span className={`text-xs ${tone}`}>{deliverySubLabel(material)}</span>
              </div>
            );
          },
        },
        {
          id: "payment",
          accessorFn: (row) => row.priceCents,
          header: ({ column }) => (
            <SortableHeader
              label="Pago"
              onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
              sorted={column.getIsSorted()}
            />
          ),
          cell: ({ row }) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{formatMoney(row.original.priceCents)}</span>
              <span className="text-xs text-muted-foreground">{paymentLabels[row.original.paymentStatus]}</span>
            </div>
          ),
        },
        {
          id: "estado",
          accessorFn: (row) => estadoChip(row).label,
          header: ({ column }) => (
            <SortableHeader
              label="Estado"
              onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
              sorted={column.getIsSorted()}
            />
          ),
          cell: ({ row }) => {
            const chip = estadoChip(row.original);
            return (
              <button
                aria-label={`Cambiar estado de ${row.original.name}`}
                className="inline-flex"
                onClick={() => onEdit(row.original)}
                type="button"
              >
                <Badge variant={chip.variant}>{chip.label}</Badge>
              </button>
            );
          },
        },
        {
          id: "actions",
          enableHiding: false,
          enableSorting: false,
          cell: ({ row }) => {
            const material = row.original;
            const supplier = supplierFor(suppliers, material.supplierId);
            const job = projectById.get(material.projectId);
            return (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      aria-label={`Más acciones para ${material.name}`}
                      className="data-open:bg-muted"
                      size="icon-sm"
                      variant="ghost"
                    />
                  }
                >
                  <MoreVerticalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(material)}>Cambiar estado</DropdownMenuItem>
                  {onOpenProject && job ? (
                    <DropdownMenuItem onClick={() => onOpenProject(job.id)}>Abrir trabajo</DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onClick={() =>
                      tryOpenWhatsApp(
                        supplier?.phone,
                        `Hola, te escribo por ${material.name} del trabajo ${job?.name ?? "en curso"}.`,
                        "Este proveedor no tiene WhatsApp guardado.",
                      )
                    }
                  >
                    WhatsApp proveedor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      tryOpenWhatsApp(
                        job?.clientPhone,
                        `Hola ${job?.clientName.split(" ")[0] ?? ""}, avance de ${material.name}: ${statusLabel(material.status)}.`,
                        "El cliente no tiene WhatsApp guardado.",
                      )
                    }
                  >
                    Avisar al cliente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      );

      return defs;
    },
    [onEdit, onOpenProject, projectById, showProjectColumn, suppliers],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!items.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No hay materiales todavía. Agrega el primero para este trabajo.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            className="max-w-sm"
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            placeholder="Buscar material o proveedor…"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              items={[
                { label: "Todos", value: "all" },
                { label: "Atrasados", value: "late" },
                { label: "Por pedir", value: "to_order" },
                { label: "Pedido", value: "ordered" },
                { label: "Recibido", value: "received" },
                { label: "Usado", value: "installed" },
              ]}
              onValueChange={(value) => {
                setStatusFilter(value ?? "all");
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              value={statusFilter}
            >
              <SelectTrigger className="w-[160px]" size="sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="late">Atrasados</SelectItem>
                  <SelectItem value="to_order">Por pedir</SelectItem>
                  <SelectItem value="ordered">Pedido</SelectItem>
                  <SelectItem value="received">Recibido</SelectItem>
                  <SelectItem value="installed">Usado</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
                <Columns3Icon data-icon="inline-start" />
                Columnas
                <ChevronDownIcon data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      const visible = column.getIsVisible();
                      const label =
                        column.id === "supplier"
                          ? "Proveedor"
                          : column.id === "delivery"
                            ? "Entrega"
                            : column.id === "payment"
                              ? "Pago"
                              : column.id === "estado"
                                ? "Estado"
                                : column.id === "name"
                                  ? "Material"
                                  : column.id === "project"
                                    ? "Trabajo"
                                    : column.id;
                      return (
                        <DropdownMenuItem
                          key={column.id}
                          onClick={() => column.toggleVisibility(!visible)}
                        >
                          <span className="flex-1">{label}</span>
                          {visible ? <CheckIcon className="size-4 text-primary" /> : null}
                        </DropdownMenuItem>
                      );
                    })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] bg-card shadow-soft">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-secondary/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan={columns.length}>
                    No hay resultados con ese filtro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} de {items.length} materiales
          </p>
          <div className="flex items-center gap-2">
            <Select
              items={[
                { label: "10", value: "10" },
                { label: "20", value: "20" },
                { label: "30", value: "30" },
              ]}
              onValueChange={(value) => table.setPageSize(Number(value ?? 10))}
              value={String(table.getState().pagination.pageSize)}
            >
              <SelectTrigger className="w-[90px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.setPageIndex(0)}
                size="icon-sm"
                variant="outline"
              >
                <ChevronsLeftIcon />
              </Button>
              <Button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size="icon-sm"
                variant="outline"
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size="icon-sm"
                variant="outline"
              >
                <ChevronRightIcon />
              </Button>
              <Button
                disabled={!table.getCanNextPage()}
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                size="icon-sm"
                variant="outline"
              >
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border/30 bg-secondary/40 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-start gap-2 text-sm text-secondary-foreground">
          <MessageCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {showProjectColumn
              ? "Tip: abre un trabajo para avisar a ese cliente, o usa las acciones de cada fila."
              : "Tip: confirma entregas y pagos por WhatsApp para tener todo en orden."}
          </span>
        </p>
        {tipProject && !showProjectColumn ? (
          <Button
            onClick={() =>
              tryOpenWhatsApp(
                tipProject.clientPhone,
                `Hola ${tipProject.clientName.split(" ")[0]}, te confirmo avances de ${tipProject.name}.`,
                "El cliente no tiene WhatsApp guardado.",
              )
            }
            variant="outline"
          >
            <MessageCircleIcon data-icon="inline-start" />
            Confirmar por WhatsApp
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
