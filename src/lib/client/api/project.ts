import { ProjectListProps } from "@/components/project/ProjectList";
import { makeHttpReq } from "@/helper/makeHttpReq";
import { toast } from "sonner";

interface IUpdateProject {
  projectId: string;
  name: string;
}

export type PaginationType = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
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
    const res = await makeHttpReq<IUpdateProject, { message: string }>(
      "PUT",
      `projects/${projectId}`,
      {
        projectId,
        name,
      },
    );
    toast.success("Project name updated successfully");
    return res;
  } catch (error) {
    console.error((error as Error)?.message);
    toast.error((error as Error)?.message);
  }
}

export type ProjectServerData = {
  projects: { projects: ProjectListProps[]; pagination: PaginationType };
};

export async function getProjects(
  page = 1,
  search: string = "",
): Promise<ProjectServerData> {
  const data = await makeHttpReq<undefined, ProjectServerData>(
    "GET",
    `projects?page=${page}&search=${search}`,
  );
  return data;
}

export async function getAgentTree(projectId: string): Promise<any> {
  const data = (await makeHttpReq(
    "GET",
    `agent/agent-tree?projectId=${projectId}`,
  )) as any;
  return data;
}

export type ChatMessage = {
  role: "ai" | "user";
  content: string;
  thinking: string;
  userId: string;
  projectId: string;
};

export type ChatHistoryReturnType = { messages: ChatMessage[] };
export interface IFetchChatHistoryType {
  userId: string;
  projectId: string;
}

export async function fetchChatHistory(
  props: IFetchChatHistoryType,
): Promise<ChatHistoryReturnType> {
  const { userId, projectId } = props;
  const data = await makeHttpReq<unknown, ChatHistoryReturnType>(
    "GET",
    `chat-history?userId=${userId}&projectId=${projectId}`,
  );
  return data;
}
