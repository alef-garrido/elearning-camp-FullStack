import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";
import { Course, CreateCourseInput, Lesson } from "@/types/api";
import { useAuth } from "@/hooks/use-auth";

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CreateCourseInput>({
    title: "",
    description: "",
    weeks: "",
    membership: 0,
    minimumSkill: "beginner",
    scholarshipsAvailable: false,
    communityId: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ApiClient.getCourse(id!);
        const c = res.data;
        setCourse(c);
        setFormData({
          title: c.title,
          description: c.description,
          weeks: c.weeks,
          membership: c.membership,
          minimumSkill: c.minimumSkill,
          scholarshipsAvailable: (c as any).scholarshipsAvailable ?? false,
          communityId: typeof c.community === 'string' ? c.community : (c.community && (c.community as any)._id) || '',
        });
      } catch (err: any) {
        toast.error(err.message || 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    // Authorization: only owner or admin can edit. Redirect otherwise.
    if (!course || !user) return;
    const isOwner = (course as any).user === user._id || (typeof (course as any).user === 'object' && (course as any).user._id === user._id);
    if (!isOwner && !isAdmin) {
      toast.error('Not authorized to edit this course');
      navigate(`/courses/${id}`);
    }
  }, [course, user, isAdmin, navigate, id]);

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Lesson editing helpers
  const getLessons = (): Lesson[] => {
    return (course && (course as any).lessons) || [];
  };

  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!course) return;
    setLessons(getLessons());
  }, [course]);

  const addLesson = () => {
    setLessons(prev => ([...prev, { _id: `new-${Date.now()}`, title: '', type: 'video', url: '', durationSeconds: 0, order: prev.length + 1, description: '', attachments: [] } as any]));
  };

  const updateLesson = (idx: number, patch: Partial<Lesson>) => {
    setLessons(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  const removeLesson = (idx: number) => {
    setLessons(prev => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        weeks: formData.weeks,
        membership: formData.membership,
        minimumSkill: formData.minimumSkill,
        scholarshipsAvailable: formData.scholarshipsAvailable,
        lessons: lessons.map((l, i) => ({
          title: l.title,
          type: l.type,
          url: l.url,
          durationSeconds: l.durationSeconds,
          order: l.order ?? (i + 1),
          description: l.description,
          attachments: (l as any).attachments || []
        }))
      };

      const res = await ApiClient.updateCourse(id!, payload);
      toast.success('Course updated');
      navigate(`/courses/${res.data._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update course');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background"><div className="container py-8 px-4"><div className="h-64 rounded-xl bg-muted animate-pulse mb-6" /></div></div>;

  if (!course) return <div className="min-h-screen bg-background"><div className="container py-12 px-4 text-center"><p className="text-muted-foreground">Course not found</p></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 sm:py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Edit Course</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Modify course details and lessons</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input id="title" required value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Enter course title" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weeks">Duration (weeks) *</Label>
                  <Input id="weeks" required value={formData.weeks} onChange={(e) => handleChange('weeks', e.target.value)} placeholder="e.g., 8" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" required value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Describe your course..." className="h-32" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="membership">Membership Cost *</Label>
                  <Input id="membership" required type="number" min={0} value={formData.membership} onChange={(e) => handleChange('membership', Number(e.target.value))} placeholder="Enter cost" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumSkill">Minimum Skill Level *</Label>
                  <Select value={formData.minimumSkill} onValueChange={(v) => handleChange('minimumSkill', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scholarshipsAvailable">Scholarship Available</Label>
                  <div className="flex items-center">
                    <Checkbox id="scholarshipsAvailable" checked={formData.scholarshipsAvailable} onCheckedChange={(v) => handleChange('scholarshipsAvailable', Boolean(v))} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Lessons</h3>
                <div className="mt-4 space-y-4">
                  {lessons.map((lesson, idx) => (
                    <Card key={lesson._id || idx} className="p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input placeholder="Title" value={lesson.title} onChange={(e) => updateLesson(idx, { title: e.target.value })} />
                        <Select value={lesson.type} onValueChange={(v) => updateLesson(idx, { type: v as any })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="URL (video/pdf)" value={lesson.url} onChange={(e) => updateLesson(idx, { url: e.target.value })} />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 mt-3">
                        <Input placeholder="Duration seconds" type="number" value={String(lesson.durationSeconds || 0)} onChange={(e) => updateLesson(idx, { durationSeconds: Number(e.target.value) })} />
                        <Input placeholder="Order" type="number" value={String(lesson.order ?? idx + 1)} onChange={(e) => updateLesson(idx, { order: Number(e.target.value) })} />
                      </div>

                      <div className="mt-3">
                        <Textarea placeholder="Lesson description" value={lesson.description} onChange={(e) => updateLesson(idx, { description: e.target.value })} className="h-20" />
                      </div>

                      <div className="flex gap-2 justify-end mt-3">
                        <Button variant="outline" onClick={() => removeLesson(idx)}>Remove</Button>
                      </div>
                    </Card>
                  ))}

                  <div>
                    <Button onClick={addLesson}>Add Lesson</Button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full sm:w-auto bg-gradient-primary hover:opacity-90" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditCourse;
