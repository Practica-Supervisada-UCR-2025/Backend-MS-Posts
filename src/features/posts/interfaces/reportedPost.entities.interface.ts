import {BasePost} from "@/features/posts/interfaces/posts.entities.interface";

export interface ReportedPost extends BasePost {
    username: string;
    email: string;
    /** Count of reports with status = ACTIVE */
    activeReports: number;
    /** Total count of all reports (active + not-active) */
    totalReports: number;
}
