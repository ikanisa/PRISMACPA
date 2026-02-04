/**
 * Template Factory stub - placeholder for @firmos/programs/template-factory.js
 * TODO: Implement actual template factory logic
 */

export interface Template {
    id: string;
    content: string;
    variables: string[];
}

export interface TemplateConfig {
    templates: Record<string, Template>;
}

export function createTemplate(_config: TemplateConfig): Template {
    return {
        id: "stub",
        content: "",
        variables: [],
    };
}

export function renderTemplate(
    template: Template,
    _variables: Record<string, string>
): string {
    return template.content;
}

export function createTemplateFactory(_config: TemplateConfig) {
    return {
        create: createTemplate,
        render: renderTemplate,
    };
}
