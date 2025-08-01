"use client";
import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import type { Beranda, FaqItem } from "@/lib/types";
import Image from "next/image";
import { PageHeader } from "@/components/admin/page-header";
import { DataCard } from "@/components/admin/data-card";
import { SuccessModal } from "@/components/admin/success-modal";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Save, Loader2 } from "lucide-react";

const FaqFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  faqData,
  setFaqData,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  faqData: FaqItem;
  setFaqData: (data: FaqItem) => void;
  isSaving: boolean;
}) => {
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFaqData({ ...faqData, [name]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {faqData.id ? "Edit FAQ" : "Tambah FAQ Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Pertanyaan</Label>
            <Input
              id="question"
              name="question"
              value={faqData.question}
              onChange={handleChange}
              required
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="answer">Jawaban</Label>
            <Textarea
              id="answer"
              name="answer"
              value={faqData.answer}
              onChange={handleChange}
              rows={4}
              required
              disabled={isSaving}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function ManageBerandaPage() {
  const [data, setData] = useState<Partial<Beranda>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFaqSaving, setIsFaqSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    action: () => void;
    message: string;
  } | null>(null);

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [launchingImageFile, setLaunchingImageFile] = useState<File | null>(
    null
  );
  const [heroImageError, setHeroImageError] = useState("");
  const [launchingImageError, setLaunchingImageError] = useState("");
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/beranda");
        if (response.ok) setData(await response.json());
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section: keyof Beranda,
    field: string
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: e.target.value },
    }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    fileStateSetter: React.Dispatch<React.SetStateAction<File | null>>,
    errorStateSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    errorStateSetter(""); // Clear previous error
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        errorStateSetter("Ukuran file tidak boleh melebihi 2MB.");
        e.target.value = ""; // Reset input file
        fileStateSetter(null);
        return;
      }
      fileStateSetter(file);
    }
  };

  const handleOpenFaqModal = (faqItem: FaqItem | null) => {
    setEditingFaq(faqItem || { id: "", question: "", answer: "" });
    setIsFaqModalOpen(true);
  };

  const handleCloseFaqModal = () => {
    setIsFaqModalOpen(false);
    setEditingFaq(null);
  };

  const handleSaveFaq = (e: FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    setIsFaqSaving(true);
    const updatedFaqList = editingFaq.id
      ? (data.faq || []).map((item) =>
          item.id === editingFaq.id ? editingFaq : item
        )
      : [...(data.faq || []), { ...editingFaq, id: crypto.randomUUID() }];
    setData((prev) => ({ ...prev, faq: updatedFaqList }));
    setIsFaqSaving(false);
    handleCloseFaqModal();
  };

  const handleDeleteFaq = (id: string) => {
    setConfirmAction({
      message: "Yakin ingin menghapus FAQ ini?",
      action: () => {
        setData((prev) => ({
          ...prev,
          faq: (prev.faq || []).filter((item) => item.id !== id),
        }));
        setConfirmAction(null);
      },
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);

    const formData = new FormData();

    const jsonData = {
      hero: {
        title: data.hero?.title,
        subtitle: data.hero?.subtitle,
      },
      slogan: data.slogan,
      launching: {
        title: data.launching?.title,
        description: data.launching?.description,
      },
      faq: data.faq,
    };
    formData.append("jsonData", JSON.stringify(jsonData));

    if (heroImageFile) {
      formData.append("heroImageFile", heroImageFile);
    }
    if (launchingImageFile) {
      formData.append("launchingImageFile", launchingImageFile);
    }

    try {
      const response = await fetch("/api/beranda", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setShowSuccessModal(true);
        setHeroImageFile(null);
        setLaunchingImageFile(null);
        const freshResponse = await fetch("/api/beranda");
        if (freshResponse.ok) setData(await freshResponse.json());
      } else {
        alert("Gagal menyimpan data.");
      }
    } catch (error) {
      console.error("Gagal menyimpan:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data beranda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Data Halaman Beranda Berhasil Disimpan!"
      />

      <ConfirmModal
        isOpen={!!confirmAction}
        onConfirm={confirmAction?.action || (() => {})}
        onCancel={() => setConfirmAction(null)}
        message={confirmAction?.message || ""}
      />

      {isFaqModalOpen && editingFaq && (
        <FaqFormModal
          isOpen={isFaqModalOpen}
          onClose={handleCloseFaqModal}
          onSubmit={handleSaveFaq}
          faqData={editingFaq}
          setFaqData={setEditingFaq}
          isSaving={isFaqSaving}
        />
      )}

      <PageHeader
        title="Kelola Halaman Beranda"
        description="Atur konten utama yang akan ditampilkan di halaman beranda website"
      >
        <Button onClick={handleSaveAll} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Menyimpan..." : "Simpan Semua Perubahan"}
        </Button>
      </PageHeader>

      <div className="grid gap-6">
        {/* Hero Section */}
        <DataCard
          title="Bagian Hero"
          description="Konten utama yang pertama dilihat pengunjung"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-title">Judul Hero</Label>
              <Input
                id="hero-title"
                value={data.hero?.title || ""}
                onChange={(e) => handleInputChange(e, "hero", "title")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle">Deskripsi Halaman</Label>
              <Textarea
                id="hero-subtitle"
                value={data.hero?.subtitle || ""}
                onChange={(e) => handleInputChange(e, "hero", "subtitle")}
                rows={3}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-image">Gambar Hero</Label>
              {data.hero?.heroImage && (
                <div className="mb-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Gambar saat ini:
                  </p>
                  <Image
                    src={data.hero.heroImage}
                    alt="Preview Hero"
                    width={200}
                    height={112}
                    className="rounded-md object-cover border"
                  />
                </div>
              )}
              <Input
                id="hero-image"
                type="file"
                onChange={(e) =>
                  handleFileChange(e, setHeroImageFile, setHeroImageError)
                }
                accept="image/png, image/jpeg, image/jpg"
                disabled={isSaving}
              />
              <p className="text-sm text-muted-foreground">
                Unggah file baru untuk mengganti gambar hero. Maks 2MB.
              </p>
              {heroImageError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{heroImageError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </DataCard>

        {/* Slogan Section */}
        <DataCard title="Bagian Slogan" description="Slogan dan deskripsi desa">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slogan-title">Judul Slogan</Label>
              <Input
                id="slogan-title"
                value={data.slogan?.title || ""}
                onChange={(e) => handleInputChange(e, "slogan", "title")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slogan-description">Deskripsi Slogan</Label>
              <Textarea
                id="slogan-description"
                value={data.slogan?.description || ""}
                onChange={(e) => handleInputChange(e, "slogan", "description")}
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>
        </DataCard>

        {/* Launching Section */}
        <DataCard
          title="Bagian Launching"
          description="Informasi program atau kegiatan terbaru"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="launching-title">Judul Launching</Label>
              <Input
                id="launching-title"
                value={data.launching?.title || ""}
                onChange={(e) => handleInputChange(e, "launching", "title")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="launching-description">Deskripsi Launching</Label>
              <Textarea
                id="launching-description"
                value={data.launching?.description || ""}
                onChange={(e) =>
                  handleInputChange(e, "launching", "description")
                }
                rows={3}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="launching-image">Gambar Launching</Label>
              {data.launching?.image && (
                <div className="mb-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Gambar saat ini:
                  </p>
                  <Image
                    src={data.launching.image || "/placeholder.svg"}
                    alt="Preview"
                    width={200}
                    height={112}
                    className="rounded-md object-cover border"
                  />
                </div>
              )}
              <Input
                id="launching-image"
                type="file"
                onChange={(e) =>
                  handleFileChange(
                    e,
                    setLaunchingImageFile,
                    setLaunchingImageError
                  )
                }
                accept="image/png, image/jpeg, image/jpg"
                disabled={isSaving}
              />
              <p className="text-sm text-muted-foreground">
                Unggah file baru untuk mengganti gambar saat ini. Maks 2MB.
              </p>
              {launchingImageError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{launchingImageError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </DataCard>

        {/* FAQ Section */}
        <DataCard
          title="Bagian FAQ"
          description="Pertanyaan yang sering diajukan"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Daftar FAQ</h3>
              <Button onClick={() => handleOpenFaqModal(null)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah FAQ
              </Button>
            </div>
            <div className="space-y-3">
              {(data.faq || []).map((item) => (
                <Card key={item.id}>
                  <CardContent>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{item.question}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.answer}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFaqModal(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFaq(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!data.faq || data.faq.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  {`Belum ada FAQ. Klik tombol "Tambah FAQ" untuk menambahkan.`}
                </p>
              )}
            </div>
          </div>
        </DataCard>
      </div>
    </div>
  );
}
