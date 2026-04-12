import { makeHttpReq } from "@/helper/makeHttpReq";
import { toast } from "sonner";

interface IUpdateProject {
  projectId: string;
  name: string;
}
export async function createProject() {
  try {
    const res = await makeHttpReq<
      { name: string },
      {
        message: string;
        project: {
          _id: string;
          name: string;
          userId: string;
        };
      }
    >("POST", "projects", { name: "Untitled Project" });
    return res;
  } catch (error) {
    console.error((error as Error)?.message);
    toast.error((error as Error)?.message);
  }
}

export async function updateProject({ projectId, name }: IUpdateProject) {
  try {
    const res = await makeHttpReq<IUpdateProject>(
      "PUT",
      `projects/${projectId}`,
      {
        projectId,
        name,
      },
    );
    return res;
  } catch (error) {
    console.error((error as Error)?.message);
    toast.error((error as Error)?.message);
  }
}
