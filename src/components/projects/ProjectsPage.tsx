import type { FC } from "react";

export interface Project {
    imageSrc?: string;
    title?: string;
    tags?: string[];
}

interface ProjectsPageProps {
    projects: Project[];
}

const ProjectsPage: FC<ProjectsPageProps> = ({ projects }) => {
    return (
        <div>
            {projects.map((project, index) => (
                <article key={`${project.title ?? "project"}-${index}`}>
                    {project.imageSrc && <img src={project.imageSrc} alt="" loading="lazy" />}
                    {project.title && <h2>{project.title}</h2>}
                    {project.tags?.length ? <p>{project.tags.join(" · ")}</p> : null}
                </article>
            ))}
        </div>
    );
};

export default ProjectsPage;
