import { toast } from "sonner";
import {
  AlertTriangleIcon,
  BriefcaseBusinessIcon,
  CircleCheckIcon,
  DownloadIcon,
  EyeIcon,
  HardHatIcon,
  HomeIcon,
  InfoIcon,
  MessageCircleIcon,
  PackageIcon,
  PhoneIcon,
  PlusIcon,
  RefreshCwIcon,
  StoreIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Material, MaterialStatus, Project, Supplier } from "../../src/domain/en-obra";
import { formatPhoneDisplay, isValidPhoneForWhatsApp } from "../../src/domain/en-obra";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DatePicker } from "@/dashboard/date-picker";
import { MaterialsDataTable } from "@/dashboard/materials-data-table";
import { applyDashboardTheme, getThemeById } from "@/dashboard/themes";
import {
  attentionState,
  openWhatsApp,
  projectLabel,
  statusLabel,
  statusOptions,
  type DashboardView,
} from "@/dashboard/model";
import { useDashboardData } from "@/dashboard/use-dashboard-data";

type FormKind = "material" | "project" | "supplier" | null;

function statusVariant(status: MaterialStatus) {
  if (status === "to_order") return "destructive" as const;
  if (status === "ordered") return "secondary" as const;
  if (status === "received") return "secondary" as const;
  return "default" as const;
}

function countReady(materials: Material[]) {
  return materials.filter((material) => material.status === "received" || material.status === "installed").length;
}

function tryOpenWhatsApp(phone: string | undefined, text: string, missingMessage: string) {
  if (!openWhatsApp(phone, text)) {
    toast.error(missingMessage);
  }
}

/** Always-visible demo disclaimer banner. */
function DemoBanner() {
  return (
    <div
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b bg-secondary/60 px-4 py-2 text-xs text-secondary-foreground"
      role="status"
    >
      <InfoIcon aria-hidden className="size-3.5 shrink-0" />
      Demo local · los datos solo viven en este navegador.
    </div>
  );
}

/** Recovery banner shown when localStorage data is corrupt. */
function StorageRecoveryBanner({
  reason,
  onRetry,
  onExport,
  onReset,
}: {
  reason?: string;
  onRetry: () => void;
  onExport: () => void;
  onReset?: () => void;
}) {
  return (
    <div
      aria-live="assertive"
      className="flex flex-col gap-3 border-b bg-destructive/10 px-4 py-3 text-sm"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-destructive">Datos no legibles en este navegador</span>
          {reason ? <span className="text-muted-foreground">{reason}</span> : null}
          <span className="text-muted-foreground">Se muestran datos demo. Tus datos reales no se borran automáticamente.</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Reintentar
        </Button>
        <Button onClick={onExport} size="sm" variant="outline">
          <DownloadIcon data-icon="inline-start" />
          Exportar respaldo
        </Button>
        {onReset ? (
          <Button
            onClick={() => {
              if (window.confirm("¿Borrar datos del navegador y restaurar demo? Descarga un respaldo primero.")) {
                onReset();
              }
            }}
            size="sm"
            variant="ghost"
          >
            Restaurar demo (DEV)
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MaterialsWorkspace({
  materials,
  project,
  suppliers,
  onEditMaterial,
}: {
  materials: Material[];
  project: Project;
  suppliers: Supplier[];
  onEditMaterial: (material: Material) => void;
}) {
  const jobSuppliers = useMemo(() => {
    const ids = new Set(materials.map((m) => m.supplierId).filter(Boolean));
    return suppliers.filter((s) => ids.has(s.id));
  }, [materials, suppliers]);

  const lastNote =
    jobSuppliers.find((supplier) => supplier.lastContactNote)?.lastContactNote ??
    `${project.clientName.split(" ")[0]}: ¿Ya llegó el material?`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-xl flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Materiales y entregas</h2>
          <p className="text-sm text-muted-foreground">
            Sigue pedidos, fechas y estados sin mezclar pagos internos con la vista del cliente.
          </p>
        </div>
        <Card className="w-full max-w-md shrink-0">
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-2">
              <MessageCircleIcon className="size-4 text-primary" />
              Último mensaje por WhatsApp
            </CardDescription>
            <CardTitle className="text-base font-medium leading-snug">{lastNote}</CardTitle>
          </CardHeader>
          <CardFooter className="justify-between gap-2">
            <span className="text-xs text-muted-foreground">Hoy · vista demo</span>
            <Button
              onClick={() =>
                tryOpenWhatsApp(
                  project.clientPhone,
                  `Hola ${project.clientName.split(" ")[0]}, te escribo por ${project.name}.`,
                  "El cliente no tiene WhatsApp guardado.",
                )
              }
              size="sm"
              variant="outline"
            >
              Abrir chat
            </Button>
          </CardFooter>
        </Card>
      </div>
      <MaterialsDataTable
        items={materials}
        onEdit={onEditMaterial}
        project={project}
        projects={[project]}
        suppliers={jobSuppliers}
      />
    </div>
  );
}

function Overview({
  materials,
  projects,
  suppliers,
  onEditMaterial,
  onOpenProject,
}: {
  materials: Material[];
  projects: Project[];
  suppliers: Supplier[];
  onEditMaterial: (material: Material) => void;
  onOpenProject: (projectId: string) => void;
}) {
  const ready = countReady(materials);
  const attentionItems = materials.filter((material) =>
    ["late", "today", "waiting"].includes(attentionState(material)),
  );
  const activeJobs = new Set(materials.map((material) => material.projectId)).size;
  const nextItems = [...attentionItems].sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1));

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Materiales listos</CardDescription>
            <CardTitle className="text-2xl">
              {ready} de {materials.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Recibidos o ya usados en todos los trabajos.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Para atender hoy</CardDescription>
            <CardTitle className="text-2xl">{attentionItems.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Atrasados, sin fecha o con entrega para hoy · {activeJobs} trabajo{activeJobs === 1 ? "" : "s"}.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Trabajos con materiales</CardDescription>
            <CardTitle className="text-2xl">{activeJobs}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Haz clic en un trabajo de la lista para entrar a su panel.
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="attention">
        <TabsList>
          <TabsTrigger value="attention">
            Para atender <Badge variant="secondary">{attentionItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">Todos los materiales</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4 shadow-lift rounded-[1.25rem]" value="attention">
          <MaterialsDataTable
            items={nextItems}
            onEdit={onEditMaterial}
            onOpenProject={onOpenProject}
            projects={projects}
            showProjectColumn
            suppliers={suppliers}
          />
        </TabsContent>
        <TabsContent className="mt-4" value="all">
          <MaterialsDataTable
            items={materials}
            onEdit={onEditMaterial}
            onOpenProject={onOpenProject}
            projects={projects}
            showProjectColumn
            suppliers={suppliers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SupplierTable({
  suppliers,
  materials,
  projects,
}: {
  suppliers: Supplier[];
  materials: Material[];
  projects: Project[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proveedores</CardTitle>
        <CardDescription>
          Agenda compartida: el mismo proveedor puede servir varios trabajos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead className="hidden lg:table-cell">Último mensaje</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Trabajos</TableHead>
              <TableHead className="text-right">Materiales</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => {
              const linked = materials.filter((material) => material.supplierId === supplier.id);
              const jobIds = new Set(linked.map((material) => material.projectId));
              const jobNames = projects
                .filter((project) => jobIds.has(project.id))
                .map((project) => project.name);
              const hasPhone = isValidPhoneForWhatsApp(supplier.phone);
              return (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="font-medium">{supplier.name}</span>
                      {supplier.category ? <Badge variant="secondary">{supplier.category}</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {hasPhone ? formatPhoneDisplay(supplier.phone) : <span className="text-muted-foreground italic">Sin WhatsApp</span>}
                  </TableCell>
                  <TableCell className="hidden max-w-md lg:table-cell">
                    <span className="line-clamp-2 text-muted-foreground">{supplier.lastContactNote}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    <span className="text-sm text-muted-foreground">
                      {jobNames.length ? jobNames.slice(0, 2).join(", ") + (jobNames.length > 2 ? ` +${jobNames.length - 2}` : "") : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{linked.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      aria-label={`WhatsApp ${supplier.name}`}
                      disabled={!hasPhone}
                      onClick={() =>
                        tryOpenWhatsApp(
                          supplier.phone,
                          `Hola, te escribo por materiales de mis trabajos.`,
                          "Este proveedor no tiene WhatsApp guardado.",
                        )
                      }
                      size="icon-sm"
                      variant="ghost"
                    >
                      <MessageCircleIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function WhatsAppPanel({
  project,
  suppliers,
  materials,
}: {
  project: Project;
  suppliers: Supplier[];
  materials: Material[];
}) {
  const late = materials.filter((material) => attentionState(material) === "late");

  const jobSuppliers = useMemo(() => {
    const ids = new Set(materials.map((m) => m.supplierId).filter(Boolean));
    return suppliers.filter((s) => ids.has(s.id));
  }, [materials, suppliers]);

  const clientHasPhone = isValidPhoneForWhatsApp(project.clientPhone);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <Badge className="w-fit" variant="secondary">
            WhatsApp
          </Badge>
          <CardTitle>Abrir chats del trabajo</CardTitle>
          <CardDescription>
            En Obra no envía mensajes sola. Abre WhatsApp con el texto listo y tú confirmas el envío.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            disabled={!clientHasPhone}
            onClick={() =>
              tryOpenWhatsApp(
                project.clientPhone,
                `Hola ${project.clientName.split(" ")[0]}, te comparto el avance de ${project.name}.`,
                "El cliente no tiene WhatsApp guardado.",
              )
            }
            variant="outline"
          >
            <MessageCircleIcon data-icon="inline-start" />
            Cliente · {project.clientName}
            {!clientHasPhone ? (
              <Badge className="ml-auto" variant="secondary">
                <PhoneIcon className="mr-1 size-3" />
                Sin teléfono
              </Badge>
            ) : null}
          </Button>
          {jobSuppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay proveedores vinculados a materiales de este trabajo aún.
            </p>
          ) : null}
          {jobSuppliers.slice(0, 6).map((supplier) => {
            const hasPhone = isValidPhoneForWhatsApp(supplier.phone);
            return (
              <Button
                key={supplier.id}
                disabled={!hasPhone}
                onClick={() =>
                  tryOpenWhatsApp(
                    supplier.phone,
                    `Hola, te escribo por materiales de ${project.name}.`,
                    "Este proveedor no tiene WhatsApp guardado.",
                  )
                }
                variant="outline"
              >
                <StoreIcon data-icon="inline-start" />
                {supplier.name}
                {!hasPhone ? (
                  <Badge className="ml-auto" variant="secondary">
                    <PhoneIcon className="mr-1 size-3" />
                    Sin teléfono
                  </Badge>
                ) : null}
              </Button>
            );
          })}
        </CardContent>
        {late.length ? (
          <CardFooter className="text-sm text-muted-foreground">
            {late.length} material{late.length === 1 ? "" : "es"} atrasado{late.length === 1 ? "" : "s"} — conviene confirmar por chat.
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}

function ClientPreview({ materials, project }: { materials: Material[]; project: Project }) {
  const ready = countReady(materials);
  const percent = materials.length ? Math.round((ready / materials.length) * 100) : 0;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Card>
        <CardHeader>
          <Badge variant="secondary">Así lo ve el cliente</Badge>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>
            Vista de {project.clientName} · {project.service}
            {project.address ? ` · ${project.address}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={percent}>
            <ProgressLabel>Avance de materiales</ProgressLabel>
            <ProgressValue />
          </Progress>
          <p className="text-sm text-muted-foreground">
            Solo materiales y avances seguros para compartir. Sin proveedores, precios ni pagos.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Materiales</CardTitle>
          <CardDescription>Actualización clara para {project.clientName}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {materials.map((material) => (
            <div className="flex items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0" key={material.id}>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{material.name}</span>
                <span className="text-sm text-muted-foreground">{material.quantity}</span>
              </div>
              <Badge variant={statusVariant(material.status)}>{statusLabel(material.status)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusSheet({
  material,
  onClose,
  onSave,
}: {
  material?: Material;
  onClose: () => void;
  onSave: (update: { status: MaterialStatus; expectedOn?: string; receivedOn?: string }) => void;
}) {
  const [status, setStatus] = useState<MaterialStatus>("to_order");
  const [expectedOn, setExpectedOn] = useState<string | undefined>();
  const [receivedOn, setReceivedOn] = useState<string | undefined>();

  useEffect(() => {
    if (material) {
      setStatus(material.status);
      setExpectedOn(material.expectedOn);
      setReceivedOn(material.receivedOn);
    }
  }, [material]);

  const needsReceipt = status === "received" || status === "installed";
  return (
    <Sheet onOpenChange={(open) => !open && onClose()} open={Boolean(material)}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Cambiar estado</SheetTitle>
          <SheetDescription>
            {material?.name}. El cambio solo se aplica al guardar.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave({ status, expectedOn, receivedOn });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="material-status">Estado</FieldLabel>
              <Select onValueChange={(next) => setStatus(next as MaterialStatus)} value={status}>
                <SelectTrigger className="w-full" id="material-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Estado del material</SelectLabel>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{statusOptions.find((option) => option.value === status)?.description}</FieldDescription>
            </Field>
            {status === "ordered" ? (
              <Field>
                <FieldLabel>Entrega estimada</FieldLabel>
                <DatePicker onChange={setExpectedOn} value={expectedOn} />
                <FieldDescription>La puedes agregar, cambiar o quitar después.</FieldDescription>
              </Field>
            ) : null}
            {needsReceipt ? (
              <Field>
                <FieldLabel>Fecha de recepción</FieldLabel>
                <DatePicker disableFuture onChange={setReceivedOn} value={receivedOn} />
                <FieldDescription>No permite una fecha futura.</FieldDescription>
              </Field>
            ) : null}
          </FieldGroup>
          <SheetFooter>
            <Button type="submit">Guardar estado</Button>
            <Button onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function NewMaterialSheet({
  open,
  activeProjectName,
  suppliers,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  activeProjectName?: string;
  suppliers: Supplier[];
  onOpenChange: (open: boolean) => void;
  onSave: (input: { expectedOn?: string; name: string; quantity: string; supplierId: string }) => boolean;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [expectedOn, setExpectedOn] = useState<string | undefined>();

  useEffect(() => {
    if (open) setSupplierId(suppliers[0]?.id ?? "");
  }, [open, suppliers]);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Nuevo material</SheetTitle>
          <SheetDescription>
            {activeProjectName
              ? `Se agregará a "${activeProjectName}".`
              : "Solo lo necesario para no perder el pedido."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!onSave({ expectedOn, name, quantity, supplierId })) {
              toast.error("Escribe el material, cantidad y proveedor.");
              return;
            }
            setName("");
            setQuantity("");
            setExpectedOn(undefined);
            onOpenChange(false);
            toast.success("Material agregado al trabajo.");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="material-name">Material</FieldLabel>
              <Input id="material-name" onChange={(event) => setName(event.target.value)} placeholder="Ej. Plantas de sombra" value={name} />
            </Field>
            <Field>
              <FieldLabel htmlFor="material-quantity">Cantidad</FieldLabel>
              <Input id="material-quantity" onChange={(event) => setQuantity(event.target.value)} placeholder="Ej. 18 piezas" value={quantity} />
            </Field>
            <Field>
              <FieldLabel htmlFor="material-supplier">Proveedor</FieldLabel>
              <Select onValueChange={(next) => setSupplierId(next ?? "")} value={supplierId}>
                <SelectTrigger className="w-full" id="material-supplier">
                  <SelectValue placeholder="Elige proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Proveedores</SelectLabel>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Entrega estimada (opcional)</FieldLabel>
              <DatePicker onChange={setExpectedOn} value={expectedOn} />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit">
              <PlusIcon data-icon="inline-start" />
              Agregar material
            </Button>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function NewProjectSheet({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: Pick<Project, "name" | "clientName" | "clientPhone" | "address">) => boolean;
}) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Nuevo trabajo</SheetTitle>
          <SheetDescription>Empieza con el cliente y el nombre del trabajo.</SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!onSave({ address, clientName, clientPhone, name })) {
              toast.error("Escribe el nombre del trabajo y del cliente.");
              return;
            }
            setName("");
            setClientName("");
            setClientPhone("");
            setAddress("");
            onOpenChange(false);
            toast.success("Trabajo creado.");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-name">Trabajo</FieldLabel>
              <Input id="project-name" onChange={(event) => setName(event.target.value)} placeholder="Ej. Jardín de Camila" value={name} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-name">Cliente</FieldLabel>
              <Input id="client-name" onChange={(event) => setClientName(event.target.value)} placeholder="Ej. Camila Torres" value={clientName} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-phone">WhatsApp (opcional)</FieldLabel>
              <Input id="client-phone" inputMode="tel" onChange={(event) => setClientPhone(event.target.value)} placeholder="55 1234 5678" value={clientPhone} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-address">Dirección (opcional)</FieldLabel>
              <Input id="project-address" onChange={(event) => setAddress(event.target.value)} placeholder="Colonia o referencia" value={address} />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit">
              <PlusIcon data-icon="inline-start" />
              Crear trabajo
            </Button>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function NewSupplierSheet({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: Pick<Supplier, "name" | "category" | "phone">) => boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Nuevo proveedor</SheetTitle>
          <SheetDescription>Guarda el contacto para encontrarlo cuando lo necesites.</SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!onSave({ category, name, phone })) {
              toast.error("Escribe el nombre del proveedor.");
              return;
            }
            setName("");
            setCategory("");
            setPhone("");
            onOpenChange(false);
            toast.success("Proveedor agregado.");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="supplier-name">Proveedor</FieldLabel>
              <Input id="supplier-name" onChange={(event) => setName(event.target.value)} placeholder="Ej. Ferretería San Luis" value={name} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-category">Qué vende (opcional)</FieldLabel>
              <Input id="supplier-category" onChange={(event) => setCategory(event.target.value)} placeholder="Ej. Riego y herramientas" value={category} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-phone">WhatsApp (opcional)</FieldLabel>
              <Input id="supplier-phone" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="55 1234 5678" value={phone} />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit">
              <PlusIcon data-icon="inline-start" />
              Agregar proveedor
            </Button>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** Nav button that closes mobile sidebar after navigation. */
function NavButton({
  isActive,
  tooltip,
  className,
  onClick,
  children,
}: {
  isActive?: boolean;
  tooltip: string;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { setOpenMobile } = useSidebar();

  const handleClick = () => {
    onClick();
    setOpenMobile(false);
  };

  return (
    <SidebarMenuButton
      className={className}
      isActive={isActive}
      onClick={handleClick}
      tooltip={tooltip}
    >
      {children}
    </SidebarMenuButton>
  );
}

function App() {
  const {
    activeProject,
    addMaterial,
    addProject,
    addSupplier,
    allMaterials,
    corruptReason,
    data,
    exportCorruptBackup,
    materials,
    resetDemo,
    retryLoad,
    selectProject,
    storageStatus,
    updateMaterialStatus,
  } = useDashboardData();
  const [view, setView] = useState<DashboardView>("home");
  const [form, setForm] = useState<FormKind>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material>();

  useEffect(() => {
    applyDashboardTheme(getThemeById("cream"));
  }, []);

  const globalAttentionCount = useMemo(
    () => allMaterials.filter((material) => ["late", "today", "waiting"].includes(attentionState(material))).length,
    [allMaterials],
  );
  const jobAttentionCount = useMemo(
    () => materials.filter((material) => ["late", "today", "waiting"].includes(attentionState(material))).length,
    [materials],
  );

  const navigate = (next: DashboardView) => setView(next);

  const openProject = (projectId: string) => {
    selectProject(projectId);
    setView("materials");
  };

  if (!activeProject) {
    return null;
  }

  const jobNavItems: Array<{ icon: typeof PackageIcon; id: Exclude<DashboardView, "home" | "client" | "suppliers">; label: string }> = [
    { id: "materials", label: "Materiales", icon: PackageIcon },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircleIcon },
  ];

  const headerTitle = view === "home" ? "Hoy" : view === "suppliers" ? "Proveedores" : activeProject.name;
  const headerSubtitle =
    view === "home"
      ? "Todos los trabajos · qué mover ahora"
      : view === "suppliers"
        ? "Contactos compartidos entre todos tus trabajos"
        : view === "client"
          ? `Cliente: ${activeProject.clientName}`
          : `Cliente: ${activeProject.clientName} · ${projectLabel(activeProject)}`;
  const headerBadge =
    view === "home"
      ? "Vista global"
      : view === "suppliers"
        ? "Agenda compartida"
        : view === "client"
          ? "Así lo ve el cliente"
          : "Panel del trabajo";

  const otherProjects = data.projects.filter((project) => project.id !== activeProject.id);
  const inJobWorkspace = view === "materials" || view === "whatsapp" || view === "client";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HardHatIcon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">En Obra</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Global</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavButton
                      isActive={view === "home"}
                      onClick={() => navigate("home")}
                      tooltip="Hoy"
                    >
                      <HomeIcon />
                      <span>Hoy</span>
                    </NavButton>
                    {globalAttentionCount ? (
                      <SidebarMenuBadge>{globalAttentionCount}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <NavButton
                      isActive={view === "suppliers"}
                      onClick={() => navigate("suppliers")}
                      tooltip="Proveedores"
                    >
                      <UsersIcon />
                      <span>Proveedores</span>
                    </NavButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Trabajo activo</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavButton
                      className="h-auto py-2"
                      isActive={inJobWorkspace}
                      onClick={() => openProject(activeProject.id)}
                      tooltip={`${activeProject.name} · ${activeProject.clientName}`}
                    >
                      <BriefcaseBusinessIcon />
                      <span className="flex min-w-0 flex-col items-start gap-0.5">
                        <span className="truncate font-medium">{activeProject.name}</span>
                        <span className="truncate text-xs font-normal text-muted-foreground">
                          {activeProject.clientName}
                        </span>
                      </span>
                    </NavButton>
                    {inJobWorkspace ? (
                      <SidebarMenuSub>
                        {jobNavItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <SidebarMenuSubItem key={item.id}>
                              <SidebarMenuSubButton
                                isActive={view === item.id}
                                render={<button type="button" />}
                                onClick={() => navigate(item.id)}
                              >
                                <Icon />
                                <span>{item.label}</span>
                                {item.id === "materials" && jobAttentionCount ? (
                                  <Badge className="ml-auto" variant="secondary">
                                    {jobAttentionCount}
                                  </Badge>
                                ) : null}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            isActive={view === "client"}
                            render={<button type="button" />}
                            onClick={() => navigate("client")}
                          >
                            <EyeIcon />
                            <span>Así lo ve {activeProject.clientName.split(" ")[0]}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Otros trabajos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {otherProjects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <NavButton
                        className="h-auto py-2"
                        onClick={() => openProject(project.id)}
                        tooltip={`${project.name} · ${project.clientName}`}
                      >
                        <BriefcaseBusinessIcon />
                        <span className="flex min-w-0 flex-col items-start gap-0.5">
                          <span className="truncate">{project.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{project.clientName}</span>
                        </span>
                      </NavButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="shrink-0 gap-1 border-t border-sidebar-border">
            <SidebarMenu>
              {import.meta.env.DEV ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      resetDemo();
                      toast.success("Demo restaurado.");
                    }}
                    tooltip="Restaurar demo"
                  >
                    <CircleCheckIcon />
                    <span>Restaurar demo</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <DemoBanner />
          {storageStatus === "corrupt" ? (
            <StorageRecoveryBanner
              onExport={exportCorruptBackup}
              onReset={import.meta.env.DEV ? resetDemo : undefined}
              onRetry={retryLoad}
              reason={corruptReason}
            />
          ) : null}
          <header className="flex min-h-16 flex-col gap-3 border-b px-4 py-4 lg:flex-row lg:items-start lg:justify-between lg:px-6">
            <div className="flex min-w-0 items-start gap-2">
              <SidebarTrigger aria-label="Abrir o cerrar menú lateral" className="mt-1" />
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight">{headerTitle}</h1>
                  <Badge variant="secondary">{headerBadge}</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">{headerSubtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setForm("project")} size="sm" variant="outline">
                <PlusIcon data-icon="inline-start" />
                Trabajo
              </Button>
              <Button onClick={() => setForm("supplier")} size="sm" variant="outline">
                <UserPlusIcon data-icon="inline-start" />
                Proveedor
              </Button>
              {view !== "client" ? (
                <Button onClick={() => setForm("material")} size="sm">
                  <PackageIcon data-icon="inline-start" />
                  Material
                </Button>
              ) : null}
            </div>
          </header>
          <div className="flex flex-1 flex-col p-4 lg:p-6">
            {view === "home" ? (
              <Overview
                materials={allMaterials}
                onEditMaterial={setEditingMaterial}
                onOpenProject={openProject}
                projects={data.projects}
                suppliers={data.suppliers}
              />
            ) : null}
            {view === "materials" ? (
              <MaterialsWorkspace
                materials={materials}
                onEditMaterial={setEditingMaterial}
                project={activeProject}
                suppliers={data.suppliers}
              />
            ) : null}
            {view === "suppliers" ? (
              <SupplierTable materials={allMaterials} projects={data.projects} suppliers={data.suppliers} />
            ) : null}
            {view === "whatsapp" ? (
              <WhatsAppPanel materials={materials} project={activeProject} suppliers={data.suppliers} />
            ) : null}
            {view === "client" ? <ClientPreview materials={materials} project={activeProject} /> : null}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <StatusSheet
        material={editingMaterial}
        onClose={() => setEditingMaterial(undefined)}
        onSave={(update) => {
          if (!editingMaterial) return;
          updateMaterialStatus(editingMaterial.id, update);
          setEditingMaterial(undefined);
          toast.success(`${editingMaterial.name}: ${statusLabel(update.status)}.`);
        }}
      />
      <NewMaterialSheet
        activeProjectName={activeProject.name}
        onOpenChange={(open) => setForm(open ? "material" : null)}
        onSave={(input) => addMaterial({ ...input, projectId: activeProject.id })}
        open={form === "material"}
        suppliers={data.suppliers}
      />
      <NewProjectSheet onOpenChange={(open) => setForm(open ? "project" : null)} onSave={addProject} open={form === "project"} />
      <NewSupplierSheet onOpenChange={(open) => setForm(open ? "supplier" : null)} onSave={addSupplier} open={form === "supplier"} />
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
