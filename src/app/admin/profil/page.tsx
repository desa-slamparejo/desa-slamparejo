"use client";
import { useState, useEffect } from "react";
import type { Profil, DemografiRow } from "@/lib/types";
import Image from "next/image";
import { PageHeader } from "@/components/admin/page-header";
import { DataCard } from "@/components/admin/data-card";
import { SuccessModal } from "@/components/admin/success-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";

export default function ManageProfilPage() {
  const [data, setData] = useState<Partial<Profil>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [sejarahImageFile1, setSejarahImageFile1] = useState<File | null>(null);
  const [sejarahImageFile2, setSejarahImageFile2] = useState<File | null>(null);
  const [sejarahImageFile3, setSejarahImageFile3] = useState<File | null>(null);
  const [heroImageError, setHeroImageError] = useState("");
  const [sejarahImageError1, setSejarahImageError1] = useState("");
  const [sejarahImageError2, setSejarahImageError2] = useState("");
  const [sejarahImageError3, setSejarahImageError3] = useState("");
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/profil-desa");
        if (response.ok) {
          const fetchedData = await response.json();
          // Membersihkan data demografi dari unit sebelum ditampilkan di form
          const cleanedData = {
            ...fetchedData,
            demografi: {
              ...fetchedData.demografi,
              totalPenduduk: (
                fetchedData.demografi.totalPenduduk || ""
              ).replace(/\D/g, ""),
              lakiLaki: (fetchedData.demografi.lakiLaki || "").replace(
                /\D/g,
                ""
              ),
              perempuan: (fetchedData.demografi.perempuan || "").replace(
                /\D/g,
                ""
              ),
              tabelData: (fetchedData.demografi.tabelData || []).map(
                (row: DemografiRow) => ({
                  ...row,
                  rt: (row.rt || "").replace(/\D/g, ""),
                  rw: (row.rw || "").replace(/\D/g, ""),
                  penduduk: (row.penduduk || "").replace(/\D/g, ""),
                })
              ),
            },
          };
          setData(cleanedData);
        }
      } catch (error) {
        console.error("Gagal mengambil data profil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNestedChange = (
    section: keyof Profil,
    field: string,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: value },
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileStateSetter: React.Dispatch<React.SetStateAction<File | null>>,
    errorStateSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    errorStateSetter("");
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        errorStateSetter("Ukuran file tidak boleh melebihi 2MB.");
        e.target.value = "";
        fileStateSetter(null);
        return;
      }
      fileStateSetter(file);
    }
  };

  const handleDemografiTableChange = (
    index: number,
    field: keyof DemografiRow,
    value: string
  ) => {
    const newTableData = [...(data.demografi?.tabelData || [])];
    newTableData[index] = { ...newTableData[index], [field]: value };

    setData((prev) => ({
      ...prev,
      demografi: {
        ...(prev.demografi as object),
        tabelData: newTableData,
      } as Profil["demografi"],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const formData = new FormData();

    // Menambahkan kembali unit sebelum menyimpan
    const { hero, demografi, ...restData } = data;
    const formattedDemografi = demografi
      ? {
          ...demografi,
          totalPenduduk: `${demografi.totalPenduduk || ""} JIWA`,
          lakiLaki: `${demografi.lakiLaki || ""} JIWA`,
          perempuan: `${demografi.perempuan || ""} JIWA`,
          tabelData: (demografi.tabelData || []).map((row) => ({
            ...row,
            rt: `${row.rt} RT`,
            rw: `${row.rw} RW`,
            penduduk: `${row.penduduk} JIWA`,
          })),
        }
      : undefined;

    const jsonData = {
      hero: { subtitle: hero?.subtitle },
      demografi: formattedDemografi,
      ...restData,
    };

    formData.append("jsonData", JSON.stringify(jsonData));

    if (heroImageFile) {
      formData.append("heroImageFile", heroImageFile);
    }
    if (sejarahImageFile1) {
      formData.append("sejarahImageFile1", sejarahImageFile1);
    }
    if (sejarahImageFile2) {
      formData.append("sejarahImageFile2", sejarahImageFile2);
    }
    if (sejarahImageFile3) {
      formData.append("sejarahImageFile3", sejarahImageFile3);
    }

    try {
      const response = await fetch("/api/profil-desa", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setShowModal(true);
        setHeroImageFile(null); // Reset file input
        setSejarahImageFile1(null);
        setSejarahImageFile2(null);
        setSejarahImageFile3(null);
        // Re-fetch data to show the new image and cleaned data
        const freshResponse = await fetch("/api/profil-desa");
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          const cleanedData = {
            ...freshData,
            demografi: {
              ...freshData.demografi,
              totalPenduduk: (freshData.demografi.totalPenduduk || "").replace(
                /\D/g,
                ""
              ),
              lakiLaki: (freshData.demografi.lakiLaki || "").replace(/\D/g, ""),
              perempuan: (freshData.demografi.perempuan || "").replace(
                /\D/g,
                ""
              ),
              tabelData: (freshData.demografi.tabelData || []).map(
                (row: DemografiRow) => ({
                  ...row,
                  rt: (row.rt || "").replace(/\D/g, ""),
                  rw: (row.rw || "").replace(/\D/g, ""),
                  penduduk: (row.penduduk || "").replace(/\D/g, ""),
                })
              ),
            },
          };
          setData(cleanedData);
        }
      } else {
        alert("Gagal menyimpan data.");
      }
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data profil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message="Data Halaman Profil Berhasil Disimpan!"
      />

      <PageHeader
        title="Kelola Halaman Profil"
        description="Atur profil, visi misi, demografi, dan sejarah desa"
      >
        <Button onClick={handleSave} disabled={isSaving}>
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
              <Label htmlFor="hero-description">Deskripsi Halaman</Label>
              <Textarea
                id="hero-description"
                value={data.hero?.subtitle || ""}
                onChange={(e) =>
                  handleNestedChange("hero", "subtitle", e.target.value)
                }
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

        {/* Video Profil */}
        <DataCard
          title="Video Profil"
          description="Video profil desa dari YouTube"
        >
          <div className="space-y-2">
            <Label htmlFor="youtube-url">Link Video YouTube</Label>
            <Input
              id="youtube-url"
              type="text"
              value={data.video?.url || ""}
              onChange={(e) =>
                handleNestedChange("video", "url", e.target.value)
              }
            />
            <p className="text-sm text-muted-foreground">
              Masukkan link YouTube untuk video profil desa yang akan
              ditampilkan di halaman profil
            </p>
          </div>
        </DataCard>

        {/* Visi Misi */}
        <DataCard title="Visi & Misi" description="Visi dan misi desa">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visi-description">Deskripsi Singkat</Label>
              <Textarea
                id="visi-description"
                value={data.visiMisi?.description || ""}
                onChange={(e) =>
                  handleNestedChange("visiMisi", "description", e.target.value)
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visi">Visi</Label>
              <Textarea
                id="visi"
                value={data.visiMisi?.visi || ""}
                onChange={(e) =>
                  handleNestedChange("visiMisi", "visi", e.target.value)
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="misi">
                Misi (pisahkan tiap poin dengan baris baru)
              </Label>
              <Textarea
                id="misi"
                value={data.visiMisi?.misi || ""}
                onChange={(e) =>
                  handleNestedChange("visiMisi", "misi", e.target.value)
                }
                rows={6}
              />
            </div>
          </div>
        </DataCard>

        {/* Demografi */}
        <DataCard
          title="Demografi"
          description="Data kependudukan dan wilayah desa"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demo-description">Deskripsi Demografi</Label>
              <Textarea
                id="demo-description"
                value={data.demografi?.description || ""}
                onChange={(e) =>
                  handleNestedChange("demografi", "description", e.target.value)
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peta-url">URL Peta Google Maps (Embed)</Label>
              <Input
                id="peta-url"
                type="text"
                value={data.demografi?.petaUrl || ""}
                onChange={(e) =>
                  handleNestedChange("demografi", "petaUrl", e.target.value)
                }
              />
              <p className="text-sm text-muted-foreground">
                Masukkan link embed Google Maps untuk menampilkan peta lokasi
                desa
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total-penduduk">Total Penduduk</Label>
                <Input
                  id="total-penduduk"
                  type="number"
                  value={data.demografi?.totalPenduduk || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "demografi",
                      "totalPenduduk",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laki-laki">Laki-laki</Label>
                <Input
                  id="laki-laki"
                  type="number"
                  value={data.demografi?.lakiLaki || ""}
                  onChange={(e) =>
                    handleNestedChange("demografi", "lakiLaki", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perempuan">Perempuan</Label>
                <Input
                  id="perempuan"
                  type="number"
                  value={data.demografi?.perempuan || ""}
                  onChange={(e) =>
                    handleNestedChange("demografi", "perempuan", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Tabel Wilayah</Label>
              {(data.demografi?.tabelData || []).map((row, index) => (
                <Card key={row.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Data Wilayah {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`wilayah-${index}`}>Nama Wilayah</Label>
                        <Input
                          id={`wilayah-${index}`}
                          value={row.wilayah}
                          onChange={(e) =>
                            handleDemografiTableChange(
                              index,
                              "wilayah",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`penduduk-${index}`}>
                          Jumlah Penduduk
                        </Label>
                        <Input
                          id={`penduduk-${index}`}
                          type="number"
                          value={row.penduduk}
                          onChange={(e) =>
                            handleDemografiTableChange(
                              index,
                              "penduduk",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`rt-${index}`}>Jumlah RT</Label>
                        <Input
                          id={`rt-${index}`}
                          type="number"
                          value={row.rt}
                          onChange={(e) =>
                            handleDemografiTableChange(
                              index,
                              "rt",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`rw-${index}`}>Jumlah RW</Label>
                        <Input
                          id={`rw-${index}`}
                          type="number"
                          value={row.rw}
                          onChange={(e) =>
                            handleDemografiTableChange(
                              index,
                              "rw",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DataCard>

        {/* Sejarah */}
        <DataCard title="Sejarah" description="Sejarah dan latar belakang desa">
          <div className="space-y-2">
            <Label htmlFor="sejarah-title">Judul Sejarah</Label>
            <Input
              id="sejarah-title"
              value={data.sejarah?.title || ""}
              onChange={(e) =>
                handleNestedChange("sejarah", "title", e.target.value)
              }
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sejarah">
              Narasi Sejarah (pisahkan paragraf dengan baris baru)
            </Label>
            <Textarea
              id="sejarah"
              value={data.sejarah?.description || ""}
              onChange={(e) =>
                handleNestedChange("sejarah", "description", e.target.value)
              }
              rows={10}
              placeholder="Masukkan sejarah desa, asal usul nama, perkembangan dari masa ke masa..."
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Label htmlFor={`sejarah-image-${i}`}>Gambar Sejarah {i}</Label>
                {data.sejarah?.sejarahImages?.[i - 1]?.src && (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Gambar saat ini:
                    </p>
                    <Image
                      src={data.sejarah.sejarahImages[i - 1].src}
                      alt={`Preview Sejarah ${i}`}
                      width={200}
                      height={112}
                      className="rounded-md object-cover border"
                    />
                  </div>
                )}
                <Input
                  id={`sejarah-image-${i}`}
                  type="file"
                  onChange={(e) => {
                    if (i === 1)
                      handleFileChange(
                        e,
                        setSejarahImageFile1,
                        setSejarahImageError1
                      );
                    if (i === 2)
                      handleFileChange(
                        e,
                        setSejarahImageFile2,
                        setSejarahImageError2
                      );
                    if (i === 3)
                      handleFileChange(
                        e,
                        setSejarahImageFile3,
                        setSejarahImageError3
                      );
                  }}
                  accept="image/png, image/jpeg, image/jpg"
                  disabled={isSaving}
                />
                <p className="text-sm text-muted-foreground">
                  Unggah file baru untuk mengganti gambar {i}. Maks 2MB.
                </p>
                {i === 1 && sejarahImageError1 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{sejarahImageError1}</AlertDescription>
                  </Alert>
                )}
                {i === 2 && sejarahImageError2 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{sejarahImageError2}</AlertDescription>
                  </Alert>
                )}
                {i === 3 && sejarahImageError3 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{sejarahImageError3}</AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  );
}
