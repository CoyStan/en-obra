import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, ScrollView, Share, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClientViewSheet } from "../components/tracker/ClientViewSheet";
import { DesktopWorkspace } from "../components/tracker/DesktopWorkspace";
import { MaterialComposer, type MaterialDraft } from "../components/tracker/MaterialComposer";
import { MaterialStatusComposer } from "../components/tracker/MaterialStatusComposer";
import { AppHeader, BottomTabBar, Snackbar, StatusStrip } from "../components/tracker/MobileChrome";
import { ProjectComposer } from "../components/tracker/ProjectComposer";
import { ProjectSwitcher } from "../components/tracker/ProjectSwitcher";
import { RegisterContactSheet } from "../components/tracker/RegisterContactSheet";
import { SettingsSheet } from "../components/tracker/SettingsSheet";
import { SupplierComposer } from "../components/tracker/SupplierComposer";
import { buildSupplierMessage, clientUpdateMessage, waMeUrl } from "../domain/en-obra/whatsapp";
import { statusMeta } from "../tracker/presentation";
import { trackerColors as color } from "../tracker/theme";
import type {
  Material,
  MaterialDetailsUpdateInput,
  MaterialStatusUpdateInput,
  NewSupplierInput,
  Project,
  ProjectLifecycle,
  Supplier,
  TrackerTab,
} from "../tracker/types";
import { useEnObraStore } from "../tracker/useEnObraStore";
import { JobDetail, JobsList } from "./tracker/JobsView";
import { BootSkeleton, RecoveryScreen, WelcomeScreen } from "./tracker/StartScreens";
import { SuppliersView } from "./tracker/SuppliersView";
import { TodayView } from "./tracker/TodayView";

const DEMO_WHATSAPP_NOTICE = "Modo ejemplo: los números de demo no son reales. No se abrirá WhatsApp.";

/** On the web, `?demo` in the URL skips the welcome screen and opens the sample data. */
function demoRequestedByUrl() {
  return Platform.OS === "web" && typeof window !== "undefined" && /[?&]demo\b/.test(window.location.search);
}

export function TrackerScreen() {
  const store = useEnObraStore();
  const {
    mode,
    data,
    isDemo,
    isLoading,
    saveState,
    infoNotice,
    clearInfoNotice,
    activeProject,
    activeProjects,
    materials,
    hoyMaterials,
    suppliers,
    projects,
    retryLoad,
    startEmptyWorkspace,
    startDemoWorkspace,
    leaveDemo,
    addProject,
    updateProject,
    setActiveProject,
    setLifecycle,
    addMaterial,
    updateMaterialDetails,
    changeMaterialStatus,
    deleteMaterial,
    restoreMaterial,
    addSupplier,
    updateSupplier,
    registerSupplierContact,
    deleteSupplier,
    eraseAll,
    exportJson,
    getRecoveryExport,
  } = store;

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  // Navigation
  const [tab, setTab] = useState<TrackerTab>("home");
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  // Sheets
  const [composerOpen, setComposerOpen] = useState(false);
  const [projectComposerOpen, setProjectComposerOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [supplierComposerOpen, setSupplierComposerOpen] = useState(false);
  const [clientViewJobId, setClientViewJobId] = useState<string | undefined>();
  const [registerContactSupplierId, setRegisterContactSupplierId] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // "New supplier" opened from inside the material composer keeps the material draft.
  const [returnToMaterial, setReturnToMaterial] = useState(false);
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft | undefined>();
  const [newSupplierId, setNewSupplierId] = useState<string | undefined>();

  // Edit targets
  const [statusEditorMaterial, setStatusEditorMaterial] = useState<Material | undefined>();
  const [editMaterial, setEditMaterial] = useState<Material | undefined>();
  const [editProject, setEditProject] = useState<Project | undefined>();
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>();

  // Undo delete
  const [deletedMaterial, setDeletedMaterial] = useState<Material | undefined>();
  const deletedMaterialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const demoAutoStarted = useRef(false);
  useEffect(() => {
    if (mode === "chooser" && !demoAutoStarted.current && demoRequestedByUrl()) {
      demoAutoStarted.current = true;
      void startDemoWorkspace();
    }
  }, [mode, startDemoWorkspace]);

  // Derived
  const selectedJob = useMemo(
    () => (selectedJobId ? projects.find((p) => p.id === selectedJobId) : undefined),
    [selectedJobId, projects],
  );

  const selectedJobMaterials = useMemo(
    () =>
      selectedJob
        ? data.materials
            .filter((m) => m.projectId === selectedJob.id)
            .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        : [],
    [selectedJob, data.materials],
  );

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [materials],
  );

  const clientViewProject = useMemo(
    () => (clientViewJobId ? projects.find((p) => p.id === clientViewJobId) : undefined),
    [clientViewJobId, projects],
  );

  const clientViewMaterials = useMemo(
    () => (clientViewProject ? data.materials.filter((m) => m.projectId === clientViewProject.id) : []),
    [clientViewProject, data.materials],
  );

  const registerContactSupplier = useMemo(
    () => (registerContactSupplierId ? suppliers.find((s) => s.id === registerContactSupplierId) : undefined),
    [registerContactSupplierId, suppliers],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openStatusEditor = (material: Material) => setStatusEditorMaterial(material);
  const openMaterialEditor = (material: Material) => {
    setEditMaterial(material);
    setComposerOpen(true);
  };
  const openNewMaterial = () => {
    setEditMaterial(undefined);
    setComposerOpen(true);
  };
  const openNewProject = () => {
    setEditProject(undefined);
    setProjectComposerOpen(true);
  };
  const openSupplierEditor = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setSupplierComposerOpen(true);
  };

  const saveMaterialDetails = (input: MaterialDetailsUpdateInput) => {
    if (!editMaterial) return false;
    const saved = updateMaterialDetails(editMaterial.id, input);
    if (saved) {
      setNotice(`${input.name.trim()}: cambios guardados.`);
      setEditMaterial(undefined);
    }
    return saved;
  };

  const saveMaterialStatus = (input: MaterialStatusUpdateInput) => {
    if (!statusEditorMaterial) return;
    changeMaterialStatus(statusEditorMaterial.id, input.status, {
      expectedOn: input.expectedOn,
      receivedOn: input.receivedOn,
    });
    setNotice(`${statusEditorMaterial.name}: ${statusMeta[input.status].label.toLowerCase()}.`);
    setStatusEditorMaterial(undefined);
  };

  const handleDeleteMaterial = (material: Material) => {
    if (deletedMaterialTimerRef.current) clearTimeout(deletedMaterialTimerRef.current);
    deleteMaterial(material.id);
    setDeletedMaterial(material);
    deletedMaterialTimerRef.current = setTimeout(() => setDeletedMaterial(undefined), 5000);
  };

  const handleUndoDelete = () => {
    if (deletedMaterialTimerRef.current) clearTimeout(deletedMaterialTimerRef.current);
    if (deletedMaterial) {
      restoreMaterial(deletedMaterial);
      setDeletedMaterial(undefined);
    }
  };

  const openNewSupplier = (fromMaterialDraft?: MaterialDraft) => {
    setEditSupplier(undefined);
    if (fromMaterialDraft) {
      setMaterialDraft(fromMaterialDraft);
      setReturnToMaterial(true);
      setComposerOpen(false);
    } else {
      setReturnToMaterial(false);
    }
    setSupplierComposerOpen(true);
  };

  const saveSupplier = useCallback(
    (input: NewSupplierInput) => {
      const supplierId = addSupplier(input);
      if (supplierId && returnToMaterial) {
        setNewSupplierId(supplierId);
        setReturnToMaterial(false);
        setComposerOpen(true);
      }
      return supplierId;
    },
    [addSupplier, returnToMaterial],
  );

  const saveProject = (input: Parameters<typeof addProject>[0]) => {
    const saved = addProject(input);
    if (saved) {
      setTab("jobs");
      setNotice(`Trabajo de ${input.clientName.trim()} listo para empezar.`);
    }
    return saved;
  };

  const saveProjectEdits = (input: Parameters<typeof updateProject>[1]) => {
    if (!editProject) return false;
    const saved = updateProject(editProject.id, input);
    if (saved) {
      setNotice(`Trabajo actualizado: ${input.name.trim()}.`);
      setEditProject(undefined);
    }
    return saved;
  };

  const saveSupplierEdits = (input: Parameters<typeof updateSupplier>[1]) => {
    if (!editSupplier) return false;
    const saved = updateSupplier(editSupplier.id, input);
    if (saved) {
      setNotice(`${input.name.trim()}: proveedor actualizado.`);
      setEditSupplier(undefined);
    }
    return saved;
  };

  const handleRegisterContact = (note: string) => {
    if (!registerContactSupplierId) return;
    registerSupplierContact(registerContactSupplierId, { note });
    setNotice("Nota guardada.");
    setRegisterContactSupplierId(undefined);
  };

  const handleSetLifecycle = (job: Project, lifecycle: ProjectLifecycle) => {
    setLifecycle(job.id, lifecycle);
    if (lifecycle === "active") {
      setNotice(`"${job.name}" reactivado.`);
      return;
    }
    setNotice(lifecycle === "completed" ? `"${job.name}" marcado como completado.` : `"${job.name}" archivado.`);
    setSelectedJobId(undefined);
  };

  const openWhatsApp = async (url: string | undefined, invalidMessage: string) => {
    if (!url) {
      setNotice(invalidMessage);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setNotice("No se pudo abrir WhatsApp en este dispositivo.");
    }
  };

  const sendClientWhatsApp = async () => {
    if (!clientViewProject) return;
    if (isDemo) {
      setNotice(DEMO_WHATSAPP_NOTICE);
      return;
    }
    if (!clientViewProject.clientPhone) {
      setNotice(`Agrega el WhatsApp de ${clientViewProject.clientName} para enviar actualizaciones.`);
      return;
    }
    const message = clientUpdateMessage(clientViewProject, clientViewMaterials);
    await openWhatsApp(waMeUrl(clientViewProject.clientPhone, message), "El número de WhatsApp del cliente no es válido.");
  };

  const sendSupplierWhatsApp = async (supplier: Supplier, materialContext?: Material) => {
    if (isDemo) {
      setNotice(DEMO_WHATSAPP_NOTICE);
      return;
    }
    if (!supplier.phone) {
      setNotice(`Agrega el WhatsApp de ${supplier.name} para escribirle desde aquí.`);
      return;
    }
    const job =
      (materialContext && projects.find((p) => p.id === materialContext.projectId)) ??
      activeProject ??
      activeProjects[0];
    const message =
      materialContext && job
        ? buildSupplierMessage({
            jobName: job.name,
            materialName: materialContext.name,
            quantity: materialContext.quantity,
            need: materialContext.status === "to_order" ? "cotización o pedido" : "seguimiento de pedido",
            expectedOn: materialContext.expectedOn,
          })
        : `Hola ${supplier.name}, te escribo sobre el trabajo${job ? ` "${job.name}"` : ""}.`;
    await openWhatsApp(waMeUrl(supplier.phone, message), "El número de WhatsApp no es válido.");
  };

  const shareText = async (text: string, title: string) => {
    try {
      await Share.share({ message: text, title });
    } catch {
      setNotice("No se pudo compartir. Intenta copiar el texto.");
    }
  };

  const handleExportJson = async () => shareText(await exportJson(), "En Obra: datos exportados");

  const handleExportRecovery = async () => {
    const raw = await getRecoveryExport();
    if (!raw) {
      setNotice("No se encontraron datos de recuperación.");
      return;
    }
    await shareText(raw, "En Obra: recuperación");
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    const result = deleteSupplier(supplier.id);
    setNotice(result.ok ? `${supplier.name}: proveedor eliminado.` : result.reason);
  };

  // ── Boot, welcome and recovery ──────────────────────────────────────────────

  if (mode === "boot" || isLoading) {
    return <BootSkeleton />;
  }

  if (mode === "chooser") {
    return (
      <>
        <WelcomeScreen
          onDemo={() => void startDemoWorkspace()}
          onStart={() => {
            startEmptyWorkspace();
            setProjectComposerOpen(true);
          }}
        />
        <ProjectComposer
          onClose={() => setProjectComposerOpen(false)}
          onSave={saveProject}
          visible={projectComposerOpen}
        />
      </>
    );
  }

  if (mode === "recovery") {
    return (
      <RecoveryScreen
        onExport={() => void handleExportRecovery()}
        onRetry={() => void retryLoad()}
        reason={store.recoveryError}
      />
    );
  }

  const sheets = (
    <>
      <ProjectSwitcher
        activeProjectId={activeProject?.id}
        onClose={() => setProjectSwitcherOpen(false)}
        onCreateProject={openNewProject}
        onEditProject={(project) => {
          setEditProject(project);
          setProjectComposerOpen(true);
        }}
        onSelectProject={setActiveProject}
        projects={projects}
        visible={projectSwitcherOpen}
      />
      <ProjectComposer
        onClose={() => {
          setProjectComposerOpen(false);
          setEditProject(undefined);
        }}
        onSave={saveProject}
        onUpdate={saveProjectEdits}
        project={editProject}
        visible={projectComposerOpen}
      />
      <SupplierComposer
        onClose={() => {
          setSupplierComposerOpen(false);
          setEditSupplier(undefined);
        }}
        onSave={saveSupplier}
        onUpdate={saveSupplierEdits}
        supplier={editSupplier}
        visible={supplierComposerOpen}
      />
      <MaterialComposer
        draft={
          newSupplierId
            ? { ...(materialDraft ?? { name: "", quantity: "" }), supplierId: newSupplierId }
            : materialDraft
        }
        material={editMaterial}
        onClose={() => {
          setComposerOpen(false);
          setEditMaterial(undefined);
          setMaterialDraft(undefined);
          setNewSupplierId(undefined);
        }}
        onNewSupplier={(currentDraft) => openNewSupplier(currentDraft)}
        onSave={(input) => {
          const projectId = selectedJobId ?? activeProject?.id;
          if (!projectId) return false;
          return addMaterial(input, projectId);
        }}
        onUpdate={saveMaterialDetails}
        suppliers={suppliers}
        visible={composerOpen || Boolean(editMaterial)}
      />
      {statusEditorMaterial ? (
        <MaterialStatusComposer
          material={statusEditorMaterial}
          onClose={() => setStatusEditorMaterial(undefined)}
          onSave={saveMaterialStatus}
          visible
        />
      ) : null}
      <RegisterContactSheet
        onClose={() => setRegisterContactSupplierId(undefined)}
        onSave={handleRegisterContact}
        supplier={registerContactSupplier}
        visible={Boolean(registerContactSupplierId)}
      />
      <ClientViewSheet
        isDemo={isDemo}
        materials={clientViewMaterials}
        onClose={() => setClientViewJobId(undefined)}
        onWhatsApp={() => void sendClientWhatsApp()}
        project={clientViewProject}
        visible={Boolean(clientViewJobId)}
      />
      <SettingsSheet
        onClose={() => setSettingsOpen(false)}
        onEraseAll={async () => {
          await eraseAll();
        }}
        onExportJson={handleExportJson}
        visible={settingsOpen}
      />
    </>
  );

  // ── Desktop ─────────────────────────────────────────────────────────────────

  if (isDesktop && activeProject) {
    return (
      <View className="flex-1" style={{ backgroundColor: color.canvas, paddingTop: insets.top }}>
        <DesktopWorkspace
          activeProject={activeProject}
          data={data}
          materials={materials}
          onAddMaterial={openNewMaterial}
          onAddProject={openNewProject}
          onAddSupplier={() => openNewSupplier()}
          onChangeMaterialStatus={openStatusEditor}
          onEditMaterial={openMaterialEditor}
          onEditSupplier={openSupplierEditor}
          onOpenClientView={() => setClientViewJobId(activeProject.id)}
          onOpenSupplierWhatsApp={(supplier) => void sendSupplierWhatsApp(supplier)}
          onSelectTab={setTab}
          onSwitchProject={() => setProjectSwitcherOpen(true)}
          sortedMaterials={sortedMaterials}
          tab={tab}
        />
        {sheets}
      </View>
    );
  }

  // ── Mobile ──────────────────────────────────────────────────────────────────

  const addLabel =
    tab === "suppliers"
      ? "Agregar proveedor"
      : tab === "jobs" && !selectedJob
        ? "Nuevo trabajo"
        : "Agregar material";

  const handleAdd = () => {
    if (tab === "suppliers") openNewSupplier();
    else if (tab === "jobs" && !selectedJob) openNewProject();
    else openNewMaterial();
  };

  const snackbarBottom = 74 + insets.bottom;

  return (
    <View className="flex-1" style={{ backgroundColor: color.canvas }}>
      <View style={{ height: insets.top, backgroundColor: color.canvas }} />
      <StatusStrip
        infoNotice={infoNotice}
        isDemo={isDemo}
        onDismissInfo={clearInfoNotice}
        onLeaveDemo={() => void leaveDemo()}
        saveState={saveState}
      />
      <AppHeader
        activeProject={activeProject}
        addLabel={addLabel}
        onAdd={handleAdd}
        onSwitchProject={() => setProjectSwitcherOpen(true)}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
          <TodayView
            activeProjects={activeProjects}
            materials={hoyMaterials}
            onChangeStatus={openStatusEditor}
            onEditMaterial={openMaterialEditor}
            onMessageSupplier={(supplier, material) => void sendSupplierWhatsApp(supplier, material)}
            onNewProject={openNewProject}
            projects={projects}
            suppliers={suppliers}
          />
        ) : null}
        {tab === "jobs" && selectedJob ? (
          <JobDetail
            job={selectedJob}
            materials={selectedJobMaterials}
            onAddMaterial={openNewMaterial}
            onBack={() => setSelectedJobId(undefined)}
            onChangeStatus={openStatusEditor}
            onDeleteMaterial={handleDeleteMaterial}
            onEditMaterial={openMaterialEditor}
            onOpenClientView={() => setClientViewJobId(selectedJob.id)}
            onSetLifecycle={(lifecycle) => handleSetLifecycle(selectedJob, lifecycle)}
            suppliers={suppliers}
          />
        ) : null}
        {tab === "jobs" && !selectedJob ? (
          <JobsList
            materials={data.materials}
            onNewProject={openNewProject}
            onOpenJob={setSelectedJobId}
            onOpenSettings={() => setSettingsOpen(true)}
            projects={projects}
          />
        ) : null}
        {tab === "suppliers" ? (
          <SuppliersView
            materials={data.materials}
            onDeleteSupplier={handleDeleteSupplier}
            onEditNote={(supplier) => setRegisterContactSupplierId(supplier.id)}
            onEditSupplier={openSupplierEditor}
            onMessageSupplier={(supplier) => void sendSupplierWhatsApp(supplier)}
            suppliers={suppliers}
          />
        ) : null}
      </ScrollView>

      {notice ? (
        <Snackbar bottom={snackbarBottom} icon="check" message={notice} onDismiss={() => setNotice(null)} />
      ) : null}
      {deletedMaterial ? (
        <Snackbar
          actionLabel="Deshacer"
          assertive
          bottom={notice ? snackbarBottom + 42 : snackbarBottom}
          icon="trash-can-outline"
          message={`"${deletedMaterial.name}" borrado`}
          onAction={handleUndoDelete}
        />
      ) : null}

      <BottomTabBar
        bottomInset={insets.bottom}
        onSelect={(next) => {
          setTab(next);
          if (next !== "jobs") setSelectedJobId(undefined);
        }}
        tab={tab}
      />

      {sheets}
    </View>
  );
}
