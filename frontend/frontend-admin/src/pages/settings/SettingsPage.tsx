import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Settings,
  User,
  KeyRound,
  Database,
  Globe,
  Save,
  Download,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/authStore";
import { useLanguageStore } from "@/store/languageStore";
import { profileSchema, changePasswordSchema } from "@/schemas/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DB_KEY } from "@/lib/mockDb";
import { cn } from "@/lib/utils";

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof changePasswordSchema>;

export function SettingsPage() {
  const currentAdmin = useAdminAuthStore((state) => state.user);
  const updateProfile = useAdminAuthStore((state) => state.updateProfile);
  const changePassword = useAdminAuthStore((state) => state.changePassword);
  
  const { lang, setLang } = useLanguageStore();

  // Dialog States
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Loading states
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Forms
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: currentAdmin?.full_name ?? "",
      email: currentAdmin?.email ?? "",
      phone: currentAdmin?.phone ?? "",
    },
  });

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPassForm,
    formState: { errors: passErrors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Profile Save
  const onSaveProfile = async (values: ProfileValues) => {
    setProfileSaving(true);
    try {
      await updateProfile(values);
      toast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Cập nhật hồ sơ thất bại.";
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  // Password Save
  const onSavePassword = async (values: PasswordValues) => {
    setPasswordSaving(true);
    try {
      await changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      toast.success("Đổi mật khẩu thành công!");
      resetPassForm();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Mật khẩu hiện tại không chính xác.";
      toast.error(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  // Seed Data Reset
  const handleResetData = async () => {
    setResetLoading(true);
    try {
      localStorage.removeItem(DB_KEY);
      toast.success("Đã reset dữ liệu thành công! Ứng dụng sẽ tự động tải lại...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      toast.error("Reset dữ liệu hệ thống thất bại.");
      setResetLoading(false);
    }
  };

  // Database Export JSON
  const handleExportData = () => {
    try {
      const rawDb = localStorage.getItem(DB_KEY);
      if (!rawDb) {
        toast.error("Không tìm thấy dữ liệu trong hệ thống.");
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(rawDb);
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", `NATEAT_DB_Export_${new Date().toISOString().split("T")[0]}.json`);
      dlAnchorElem.click();
      toast.success("Xuất tập tin JSON thành công!");
    } catch {
      toast.error("Xuất dữ liệu thất bại.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Cài Đặt Hệ Thống"
        description="Cấu hình tùy chọn ngôn ngữ hiển thị, cập nhật thông tin bảo mật và quản lý tệp dữ liệu."
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl max-w-md bg-card border border-border/50 p-1">
          <TabsTrigger value="profile" className="rounded-xl text-xs font-bold py-2.5">
            <User className="h-4 w-4 mr-1.5 shrink-0" />
            Hồ sơ & Bảo mật
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-xl text-xs font-bold py-2.5">
            <Database className="h-4 w-4 mr-1.5 shrink-0" />
            Cấu hình dữ liệu
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Form Profile */}
            <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Thông tin cá nhân</CardTitle>
                    <CardDescription className="text-xs">Cập nhật họ tên, email liên hệ của tài khoản Admin.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Họ và tên
                    </Label>
                    <Input id="full_name" {...regProfile("full_name")} className={cn("h-10 rounded-[8px] font-sans", profErrors.full_name && "border-destructive focus-visible:ring-destructive")} />
                    {profErrors.full_name && <p className="text-xs font-bold text-destructive mt-1.5">{profErrors.full_name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Địa chỉ Email
                    </Label>
                    <Input id="email" type="email" {...regProfile("email")} className={cn("h-10 rounded-[8px] font-sans", profErrors.email && "border-destructive focus-visible:ring-destructive")} />
                    {profErrors.email && <p className="text-xs font-bold text-destructive mt-1.5">{profErrors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Số điện thoại
                    </Label>
                    <Input id="phone" {...regProfile("phone")} className={cn("h-10 rounded-[8px] font-sans", profErrors.phone && "border-destructive focus-visible:ring-destructive")} />
                    {profErrors.phone && <p className="text-xs font-bold text-destructive mt-1.5">{profErrors.phone.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-[#7655aa] hover:bg-[#67489a] text-white font-bold rounded-[8px] w-full h-10 flex items-center justify-center gap-1.5 transition"
                  >
                    {profileSaving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
                    Lưu thông tin
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Form Password */}
            <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Thay đổi mật khẩu</CardTitle>
                    <CardDescription className="text-xs">Thiết lập mật khẩu bảo mật mới cho tài khoản.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handlePassSubmit(onSavePassword)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="old_password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Mật khẩu hiện tại
                    </Label>
                    <Input id="old_password" type="password" {...regPass("old_password")} className={cn("h-10 rounded-[8px] font-sans", passErrors.old_password && "border-destructive focus-visible:ring-destructive")} />
                    {passErrors.old_password && <p className="text-xs font-bold text-destructive mt-1.5">{passErrors.old_password.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new_password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Mật khẩu mới</span>
                      <span className="text-[9px] text-muted-foreground/75 font-semibold leading-none lowercase">(tối thiểu 8 ký tự, có viết hoa & số)</span>
                    </Label>
                    <Input id="new_password" type="password" {...regPass("new_password")} className={cn("h-10 rounded-[8px] font-sans", passErrors.new_password && "border-destructive focus-visible:ring-destructive")} />
                    {passErrors.new_password && <p className="text-xs font-bold text-destructive mt-1.5">{passErrors.new_password.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Xác nhận mật khẩu mới
                    </Label>
                    <Input id="confirm_password" type="password" {...regPass("confirm_password")} className={cn("h-10 rounded-[8px] font-sans", passErrors.confirm_password && "border-destructive focus-visible:ring-destructive")} />
                    {passErrors.confirm_password && <p className="text-xs font-bold text-destructive mt-1.5">{passErrors.confirm_password.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={passwordSaving}
                    className="bg-[#7655aa] hover:bg-[#67489a] text-white font-bold rounded-[8px] w-full h-10 flex items-center justify-center gap-1.5 transition"
                  >
                    {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
                    Cập nhật mật khẩu
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SYSTEM CONFIG TAB */}
        <TabsContent value="system" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Language Switch */}
            <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Ngôn ngữ hệ thống</CardTitle>
                    <CardDescription className="text-xs">Lựa chọn hiển thị ngôn ngữ giao diện (vi/en/ja).</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-border/30">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground">Tiếng Việt (Vietnamese)</div>
                    <div className="text-[10px] font-medium text-muted-foreground">Ngôn ngữ hiển thị mặc định của hệ thống.</div>
                  </div>
                  <Button
                    variant={lang === "vi" ? "default" : "outline"}
                    className={`rounded-lg h-9 text-xs font-bold ${lang === "vi" ? "bg-[#7655aa] hover:bg-[#67489a]" : ""}`}
                    onClick={() => setLang("vi")}
                  >
                    Kích hoạt
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-border/30">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground">Tiếng Anh (English)</div>
                    <div className="text-[10px] font-medium text-muted-foreground">Giao diện ngôn ngữ quốc tế.</div>
                  </div>
                  <Button
                    variant={lang === "en" ? "default" : "outline"}
                    className={`rounded-lg h-9 text-xs font-bold ${lang === "en" ? "bg-[#7655aa] hover:bg-[#67489a]" : ""}`}
                    onClick={() => setLang("en")}
                  >
                    Kích hoạt
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-border/30">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground">Tiếng Nhật (Japanese)</div>
                    <div className="text-[10px] font-medium text-muted-foreground">Giao diện ngôn ngữ tiếng Nhật.</div>
                  </div>
                  <Button
                    variant={lang === "ja" ? "default" : "outline"}
                    className={`rounded-lg h-9 text-xs font-bold ${lang === "ja" ? "bg-[#7655aa] hover:bg-[#67489a]" : ""}`}
                    onClick={() => setLang("ja")}
                  >
                    Kích hoạt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* LocalStorage Database Actions */}
            <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Bảo trì & Cơ sở dữ liệu</CardTitle>
                    <CardDescription className="text-xs">Công cụ reset hạt giống dữ liệu hoặc xuất nhập tập tin JSON.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Export Action */}
                <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-border/30">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground">Xuất dữ liệu hệ thống</div>
                    <div className="text-[10px] font-medium text-muted-foreground">Tải bản sao lưu cơ sở dữ liệu hiện tại (.json).</div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-lg h-9 text-xs font-bold text-primary border-primary/20 hover:bg-primary/10 flex items-center gap-1"
                    onClick={handleExportData}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Tải JSON
                  </Button>
                </div>

                {/* Reset Action */}
                <div className="flex items-center justify-between bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-destructive">Khôi phục cài đặt gốc</div>
                    <div className="text-[10px] font-medium text-muted-foreground">Reset toàn bộ cơ sở dữ liệu về dữ liệu mẫu ban đầu.</div>
                  </div>
                  <Button
                    variant="ghost"
                    className="rounded-lg h-9 text-xs font-bold text-destructive hover:bg-rose-500/10 flex items-center gap-1 border border-rose-500/20"
                    onClick={() => setResetOpen(true)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog seed data reset */}
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={(open) => !open && setResetOpen(false)}
        title="Khôi phục dữ liệu gốc?"
        description={
          <div className="space-y-2">
            <p>Toàn bộ tài khoản, công thức và dữ liệu được thêm mới của tất cả các gia đình sẽ bị xóa sạch.</p>
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 text-xs font-bold text-destructive rounded-xl border border-destructive/20">
              <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
              <span>Cảnh báo: Hành động này không thể hoàn tác, hệ thống sẽ tự động tải lại sau khi hoàn tất.</span>
            </div>
          </div>
        }
        primaryLabel="Khôi phục"
        type="destructive"
        onConfirm={handleResetData}
        isLoading={resetLoading}
      />
    </div>
  );
}
export default SettingsPage;
