"use client";

import { ProjectTypeProps } from "@/services/ProjectService";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { formatUpdatedAt } from "@/lib/utils";

export type ProjectListProps = ProjectTypeProps & {
  _id: string;
  updatedAt: string;
};

const ProjectList = ({ projects }: { projects: ProjectListProps[] }) => {
  const router = useRouter();

  const viewProject = async (project: ProjectListProps) => {
    router.push(`/workflows/${project._id}`);
  };

  return (
    <>
      {projects?.map((project) => (
        <Card
          key={project._id}
          className="rounded-2xl shadow-sm border border-gray-200 dark:border-gray-900"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="truncate font-medium pb-4">{project?.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{formatUpdatedAt(project?.updatedAt)}</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                className="cursor-pointer"
                onClick={() => viewProject(project)}
                size={"sm"}
                variant={"outline"}
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};
export default ProjectList;
