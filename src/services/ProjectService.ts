import { Project } from "@/models/ProjectSchema";

export type ProjectTypeProps = {
  name: string;
  userId: string;
  status?: string;
  trigger?: string;
};

export class ProjectService {
  private static instance: ProjectService;

  // singleton pattern
  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  async createProject(props: ProjectTypeProps) {
    const project = new Project({
      ...props,
    });
    const newProject = await project.save();
    return newProject.toObject();
  }

  async updateProjects(props: { id: string; name: string; userId?: string }) {
    const updateNote = await Project.findByIdAndUpdate(
      props.id,
      {
        name: props.name,
      },
      {
        new: true,
        runValidators: true,
      },
    );
    return updateNote;
  }

  async getSingleProject(projectId: string) {
    const project = await Project.findById(projectId);
    return project;
  }

  async getAllProjects({
    search = "",
    page = 1,
    limit = 10,
  }: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const [projects, total] = await Promise.all([
      await Project.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
