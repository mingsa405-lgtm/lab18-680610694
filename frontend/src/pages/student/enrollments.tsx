import { useState } from "react";
import { ArrowRightLeft, PlusCircle } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/auth-store";
import { useEnrollmentStore } from "@/lib/enrollment-store";

export default function StudentEnrollmentsPage() {
  const studentId = useAuthStore((s) => s.studentId);
  const {
    students,
    courses,
    enrollments,
    enroll,
    updateEnrollment,
    dropEnrollment,
  } = useEnrollmentStore();

  // State Dialog ลงทะเบียนวิชาใหม่
  const [open, setOpen] = useState(false);
  const [formCourse, setFormCourse] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับ Dialog เปลี่ยนวิชา
  const [changeTargetCourseId, setChangeTargetCourseId] = useState<string | null>(null);
  const [newSelectedCourse, setNewSelectedCourse] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  // State Error เหนือตารางกรณี Drop ไม่สำเร็จ
  const [dropError, setDropError] = useState<string | null>(null);

  const me = students.find((s) => s.studentId === studentId);
  const myEnrollments = enrollments.filter((e) => e.studentId === studentId);

  // วิชาที่ยังไม่ได้ลงทะเบียน
  const courseOptions = courses
    .filter((c) => !myEnrollments.some((e) => e.courseId === c.courseId))
    .map((c) => ({
      value: c.courseId,
      label: `${c.courseId} — ${c.courseTitle}`,
    }));

  const courseOf = (courseId: string) =>
    courses.find((c) => c.courseId === courseId);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setFormCourse(null);
      setServerError(null);
    }
  };

  const handleEnroll = async () => {
    if (!studentId || !formCourse) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await enroll(studentId, formCourse);
      handleOpenChange(false);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChangeDialog = (courseId: string) => {
    setChangeTargetCourseId(courseId);
    setNewSelectedCourse(null);
    setChangeError(null);
  };

  const handleChangeCourse = async () => {
    if (!studentId || !changeTargetCourseId || !newSelectedCourse) return;
    setIsChanging(true);
    setChangeError(null);
    try {
      await updateEnrollment(studentId, changeTargetCourseId, newSelectedCourse);
      setChangeTargetCourseId(null);
    } catch (err) {
      setChangeError((err as Error).message);
    } finally {
      setIsChanging(false);
    }
  };

  const handleDrop = async (courseId: string) => {
    if (!studentId) return;
    setDropError(null);
    try {
      await dropEnrollment(studentId, courseId);
    } catch (err) {
      setDropError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">จัดการการลงทะเบียน</h1>
          <p className="text-sm text-muted-foreground">
            {me
              ? `${me.studentId} — ${me.firstName} ${me.lastName} (${me.program})`
              : (studentId ?? "-")}{" "}
            · ลงทะเบียนแล้ว {myEnrollments.length} วิชา
          </p>
        </div>

        {/* ปุ่มและ Dialog ลงทะเบียนเรียน */}
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button disabled={!studentId} />}>
            <PlusCircle className="h-4 w-4" />
            ลงทะเบียนเรียน
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>ลงทะเบียนเรียน</DialogTitle>
              <DialogDescription>
                เลือกวิชาที่ยังไม่ได้ลงทะเบียน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="formCourse">วิชา</Label>
              <Select
                items={courseOptions}
                value={formCourse}
                onValueChange={(v) => setFormCourse(v as string)}
              >
                <SelectTrigger id="formCourse" className="w-full">
                  <SelectValue
                    placeholder={
                      courseOptions.length === 0
                        ? "ลงทะเบียนครบทุกวิชาแล้ว"
                        : "เลือกวิชา"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <DialogFooter>
              <Button
                disabled={!formCourse || submitting}
                onClick={handleEnroll}
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ข้อความ Error เหนือตาราง */}
      {dropError && (
        <p className="text-sm text-destructive font-medium">
          ยกเลิกวิชาไม่สำเร็จ: {dropError}
        </p>
      )}

      {/* ตารางแสดงการลงทะเบียนและคอลัมน์ Action */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัสวิชา</TableHead>
              <TableHead>ชื่อวิชา</TableHead>
              <TableHead>ผู้สอน</TableHead>
              <TableHead>วันที่ลงทะเบียน</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEnrollments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-20 text-center text-muted-foreground"
                >
                  ยังไม่ได้ลงทะเบียนวิชาใด
                </TableCell>
              </TableRow>
            )}
            {myEnrollments.map((e) => {
              const course = courseOf(e.courseId);
              return (
                <TableRow key={e.courseId}>
                  <TableCell>{e.courseId}</TableCell>
                  <TableCell>{course?.courseTitle ?? "-"}</TableCell>
                  <TableCell>{course?.instructors.join(", ") || "-"}</TableCell>
                  <TableCell>
                    {e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleString("th-TH")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* 4.2 ปุ่มเปลี่ยนวิชา */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenChangeDialog(e.courseId)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>

                      {/* 4.3 ปุ่มยกเลิกการลงทะเบียน */}
                      <ConfirmDeleteButton
                        label={`ยกเลิกการลงทะเบียนวิชา ${e.courseId}`}
                        title={`ยกเลิกการลงทะเบียนวิชา ${e.courseId}?`}
                        description={`คุณต้องการยกเลิกการลงทะเบียนวิชา ${e.courseId} (${course?.courseTitle ?? ""}) ใช่หรือไม่?`}
                        onConfirm={() => handleDrop(e.courseId)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 4.2 Dialog เปลี่ยนวิชา */}
      <Dialog
        open={Boolean(changeTargetCourseId)}
        onOpenChange={(next) => {
          if (!next) {
            setChangeTargetCourseId(null);
            setNewSelectedCourse(null);
            setChangeError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เปลี่ยนวิชา {changeTargetCourseId}</DialogTitle>
            <DialogDescription>
              เลือกวิชาใหม่แทนวิชา {changeTargetCourseId} (เลือกได้เฉพาะวิชาที่ยังไม่ได้ลงทะเบียน)
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5 py-2">
            <Label htmlFor="changeCourse">วิชาใหม่</Label>
            <Select
              items={courseOptions}
              value={newSelectedCourse}
              onValueChange={(v) => setNewSelectedCourse(v as string)}
            >
              <SelectTrigger id="changeCourse" className="w-full">
                <SelectValue
                  placeholder={
                    courseOptions.length === 0
                      ? "ไม่มีวิชาอื่นให้เลือก"
                      : "เลือกวิชา"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {changeError && (
            <p className="text-sm text-destructive">{changeError}</p>
          )}

          <DialogFooter>
            <Button
              disabled={!newSelectedCourse || isChanging}
              onClick={handleChangeCourse}
            >
              <ArrowRightLeft className="h-4 w-4" />
              {isChanging ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}