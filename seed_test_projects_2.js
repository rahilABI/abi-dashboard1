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

const group1 = ["Abhay P A", "Dhigin Chanikya", "Mohammad Rahil", "Adarsh Jayaraj"];
const types1 = ["automation", "website", "workflow"];

const group2 = ["Vinaykumar B Kandibal", "Pavan C", "Sunil Morries"];
const types2 = ["dashboards", "data insights"];

const depts = ["Software", "IT", "HR", "Sales", "Finance", "Marketing"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  console.log("Fetching users and status lookers...");
  const { data: users } = await supabase.from('users').select('user_id, display_name');
  const { data: statuses } = await supabase.from('status_looker').select('id, status_name');
  
  if (!users || !statuses) {
    console.error("Failed to fetch users or statuses");
    return;
  }

  const publishedStatus = statuses.find(s => s.status_name === "Users feedback") || statuses[0];

  const projectsToInsert = [];
  const metricsToInsert = [];

  let ticketCounter = randomInt(5000, 9000);

  const generateForPerson = (name, allowedTypes) => {
    const user = users.find(u => u.display_name === name);
    if (!user) {
      console.warn(`User ${name} not found in DB, skipping...`);
      return;
    }
    
    // Create 5 projects
    for (let i = 0; i < 5; i++) {
      const type = randomItem(allowedTypes);
      const ticketId = `AUTO-${ticketCounter++}`;
      
      // Basic project
      projectsToInsert.push({
        ticket_id: ticketId,
        department: randomItem(depts),
        problem_statement: `Automated test problem statement for ${type} ${i}`,
        is_published: true, // we want to see them on the portal
        assigned_user_id: user.user_id,
        stakeholders: "Admin, QA",
        project_name: `${name}'s ${type} Project ${i}`,
        type: type,
        project_description: `This is an auto-generated ${type} project assigned to ${name}.`,
        status_looker_id: publishedStatus.id
      });

      // Partial metrics
      const metrics = { ticket_id: ticketId, tools_used: '["React", "Node.js"]' };
      
      // Randomize metrics based on type
      if (type === 'automation' || type === 'workflow') {
        metrics.total_hours_saved = randomInt(10, 50);
        if (Math.random() > 0.5) metrics.optimization_rate = randomInt(10, 80);
      } else if (type === 'website') {
        metrics.data_visibility_improved = randomInt(2, 5);
        metrics.adoption_rate = randomInt(50, 95);
      } else if (type === 'dashboards' || type === 'data insights') {
        metrics.data_visibility_improved = randomInt(2, 10);
        metrics.adoption_rate = randomInt(60, 100);
        if (Math.random() > 0.5) metrics.security_rate = randomInt(80, 100);
      }
      
      if (Math.random() > 0.7) {
        metrics.sla_compliance = randomInt(90, 100);
      }
      
      metricsToInsert.push(metrics);
    }
  };

  group1.forEach(name => generateForPerson(name, types1));
  group2.forEach(name => generateForPerson(name, types2));

  console.log(`Inserting ${projectsToInsert.length} projects...`);
  const { error: pErr } = await supabase.from('projects').insert(projectsToInsert);
  if (pErr) {
    console.error("Error inserting projects:", pErr);
    return;
  }

  console.log(`Inserting ${metricsToInsert.length} project metrics...`);
  const { error: mErr } = await supabase.from('project_metrics').insert(metricsToInsert);
  if (mErr) {
    console.error("Error inserting metrics:", mErr);
    return;
  }

  console.log("Seeding complete!");
}

run();
