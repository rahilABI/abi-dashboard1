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

async function seedTestMetrics() {
  console.log("Fetching up to 3 published projects...");
  const { data: projects, error } = await supabase
    .from('projects')
    .select('ticket_id, project_name')
    .eq('is_published', true)
    .limit(3);

  if (error) {
    console.error("Error fetching projects:", error.message);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log("No published projects found! Please publish a project first.");
    return;
  }

  console.log(`Found ${projects.length} published projects.`);

  const testCases = [
    {
      tools_used: 'React, Node.js, PostgreSQL',
      process_time_before: '2 weeks',
      process_time_after: '4 hours',
      process_before: 'The previous system relied entirely on manual data entry across three separate excel spreadsheets. Analysts had to physically cross-reference rows to verify data integrity, which led to significant bottlenecks at the end of every fiscal quarter.',
      process_after: 'A fully automated cron-job workflow now pulls data directly from the APIs into a centralized Supabase database. The React dashboard visualizes this in real-time, completely eliminating the need for manual CSV exports.',
      error_rate_before: '18%',
      error_rate_after: '< 1%',
      security_rate: 100,
      data_visibility_improved: 5,
      optimization_rate: 98,
      adoption_rate: 95,
      sla_compliance: 99.9,
      error_rate_reduced: 94,
      total_hours_saved: 12500
    },
    {
      tools_used: 'Next.js, TailwindCSS, Vercel',
      process_time_before: '45 minutes per request',
      process_time_after: 'Instantaneous',
      process_before: 'Clients would email support with basic account queries, requiring a human agent to look up the status in the legacy CRM and draft a custom email response. This resulted in huge backlogs on Mondays.',
      process_after: 'Clients now log directly into the self-serve Next.js portal where they can securely view their own account telemetry instantly without ever opening a support ticket.',
      error_rate_before: '5%',
      error_rate_after: '0%',
      security_rate: 100,
      data_visibility_improved: 2,
      optimization_rate: 85,
      adoption_rate: 78,
      sla_compliance: 100,
      error_rate_reduced: 100,
      total_hours_saved: 4200
    },
    {
      tools_used: 'Python, TensorFlow, AWS',
      process_time_before: '7 days',
      process_time_after: '30 seconds',
      process_before: 'Forecasting was done by hiring external contractors to run heuristic models on historical flat files once a month.',
      process_after: 'An AWS Lambda function triggers a TensorFlow model that continuously evaluates incoming streams and updates the forecast parameters dynamically.',
      error_rate_before: '22%',
      error_rate_after: '3%',
      security_rate: 95,
      data_visibility_improved: 10,
      optimization_rate: 90,
      adoption_rate: 65,
      sla_compliance: 98,
      error_rate_reduced: 86,
      total_hours_saved: 38000
    }
  ];

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const testCase = testCases[i];
    
    console.log(`Seeding metrics for project: ${project.project_name} (${project.ticket_id})`);
    
    const { error: upsertError } = await supabase
      .from('project_metrics')
      .upsert({
        ticket_id: project.ticket_id,
        ...testCase
      });

    if (upsertError) {
      console.error(`Failed to seed ${project.ticket_id}:`, upsertError.message);
    } else {
      console.log(`Successfully seeded!`);
    }
  }
  
  console.log("\nDone! You can now check your local dashboard and showcase app to see the results.");
}

seedTestMetrics();
