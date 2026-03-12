import { RawAuditData } from "../services/puppeteerService";
import { IIssue } from "../models/AuditResult";

export const analyzeRawData = (data: RawAuditData): IIssue[] => {
  const issues: IIssue[] = [];

  if (!data.title) {
    issues.push({
      type: "missing_title",
      severity: "critical",
      element: "<title></title>",
    });
  }

  if (!data.metaDescription) {
    issues.push({
      type: "missing_meta_description",
      severity: "critical",
      element: '<meta name="description" content="...">\n',
    });
  }

  if (data.h1Count === 0) {
    issues.push({
      type: "missing_h1",
      severity: "critical",
      element: "<h1></h1>",
    });
  } else if (data.h1Count > 1) {
    issues.push({
      type: "multiple_h1",
      severity: "warning",
      element: `Found ${data.h1Count} <h1> tags`,
    });
  }

  if (data.imagesWithoutAlt > 0) {
    issues.push({
      type: "missing_alt_text",
      severity: "warning",
      element: `${data.imagesWithoutAlt} images missing alt text`,
    });
  }

  return issues;
};
