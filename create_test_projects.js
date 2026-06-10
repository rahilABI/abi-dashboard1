import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createProjects() {
  const { data: lokkerData } = await supabase.from('lokker').select('*').eq('category', 'type');
  
  const automationType = lokkerData.find(l => l.label.toLowerCase() === 'automation') || { id: 1 };
  const biType = lokkerData.find(l => l.label.toLowerCase() === 'data insights' || l.label.toLowerCase() === 'dashboards') || { id: 2 };

  const newProjects = [
    {
      project_name: 'Workflow Auto-Pilot',
      project_description: 'An end-to-end automation suite handling internal support tickets, assigning them to the right team members without human intervention.',
      problem_statement: 'Manual triaging of support tickets was taking 20 hours a week.',
      type_looker_id: automationType.id,
      is_published: true,
      ticket_id: 'AUTO-' + Math.floor(Math.random() * 10000)
    },
    {
      project_name: 'Executive BI Dashboard',
      project_description: 'A comprehensive Business Intelligence portal providing real-time sales, marketing, and operations metrics directly to the executive team.',
      problem_statement: 'Executives had to wait until end-of-month for aggregated data reports.',
      type_looker_id: biType.id,
      is_published: true,
      ticket_id: 'BI-' + Math.floor(Math.random() * 10000)
    }
  ];

  const { data: insertedProjects, error } = await supabase.from('projects').insert(newProjects).select();

  if (error) {
    console.error("Error inserting projects:", error);
    return;
  }

  console.log("Successfully created projects:", insertedProjects.map(p => p.project_name));

  // Seed metrics for these projects so they look good on the showcase
  const metrics = [
    {
      ticket_id: insertedProjects[0].ticket_id,
      tools_used: 'n8n, Python, Slack API',
      process_time_before: '15 minutes per ticket',
      process_time_after: 'Instant',
      process_before: 'Agents manually read each ticket and decided who should handle it. This created huge bottlenecks during peak hours.',
      process_after: 'The automation instantly analyzes the text, determines urgency, and assigns it to the available agent with the right skills.',
      error_rate_before: '12%',
      error_rate_after: '1%',
      total_hours_saved: 1040,
      optimization_rate: 95
    },
    {
      ticket_id: insertedProjects[1].ticket_id,
      tools_used: 'Tableau, Snowflake, dbt',
      process_time_before: '5 days for monthly report',
      process_time_after: 'Real-time',
      process_before: 'Data analysts spent days querying different databases and stitching them together in Excel for the executive presentation.',
      process_after: 'Data pipelines automatically feed live data into the BI dashboard, allowing executives to see metrics as they happen.',
      data_visibility_improved: 10,
      total_hours_saved: 480,
      adoption_rate: 100
    }
  ];

  const { error: metricsError } = await supabase.from('project_metrics').insert(metrics);
  if (metricsError) {
    console.error("Error inserting metrics:", metricsError);
  } else {
    console.log("Successfully seeded metrics for the new projects!");
  }
}

createProjects();
