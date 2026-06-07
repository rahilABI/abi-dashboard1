import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, X, Paperclip, Check, Save, Plus, FileText, Lock, Unlock, Sun, Moon } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

// ==========================================
// MOCK INITIAL DATA
// ==========================================
const INITIAL_PROJECTS = [
  {
    projectId: "mock-1",
    ticketId: "MOCK-101",
    department: "Software",
    problemStatement: "Legacy code base experiencing high technical debt leading to frequent build failures.",
    projectStatus: "Development",
    isPublished: true,
    assignedTo: "Adarsh Jayaraj",
    summary: {
      projectName: "Project Phoenix - Codebase Modernization",
      type: "Refactor",
      projectDescription: "Migrating from legacy class components to React hooks and implementing strict TypeScript typings.",
      meetings: [],
      attachments: []
    }
  },
  {
    projectId: "mock-2",
    ticketId: "MOCK-204",
    department: "Automation & Business Intelligence",
    problemStatement: "Lack of centralized reporting limits leadership visibility into operational metrics.",
    projectStatus: "testing",
    isPublished: true,
    assignedTo: "Mohammad Rahil",
    summary: {
      projectName: "OmniSight Dashboard",
      type: "Data Visualization",
      projectDescription: "Developing a single pane of glass dashboard aggregating cross-departmental KPIs.",
      meetings: [
        { id: "m_test1", timestamp: "2026-06-01 10:00 AM", synopsis: "Initial requirement gathering with stakeholders." }
      ],
      attachments: []
    }
  },
  {
    projectId: "mock-3",
    ticketId: "MOCK-305",
    department: "QA",
    problemStatement: "Manual regression testing takes over 4 days, delaying release cycles.",
    projectStatus: "Solution",
    isPublished: false,
    assignedTo: "Abhay P A",
    summary: null
  },
  {
    projectId: "mock-4",
    ticketId: "MOCK-408",
    department: "Product & Design",
    problemStatement: "User churn during onboarding flow has increased by 15% this quarter.",
    projectStatus: "design",
    isPublished: true,
    assignedTo: "Pavan C",
    summary: {
      projectName: "Onboarding Flow Revamp 2.0",
      type: "UI/UX Redesign",
      projectDescription: "Streamlining the sign-up process and introducing an interactive tutorial.",
      meetings: [],
      attachments: []
    }
  },
  {
    projectId: "mock-5",
    ticketId: "MOCK-512",
    department: "IT",
    problemStatement: "Unexpected AWS billing spikes during non-peak hours.",
    projectStatus: "Problem Discovery",
    isPublished: false,
    assignedTo: "Sunil Morries",
    summary: null
  }
];

const TEAM_MEMBERS = [
  "Unassigned",
  "Abhay P A",
  "Adarsh Jayaraj",
  "Dhigin Chanikya",
  "Mohammad Rahil",
  "Pavan C",
  "Sunil Morries",
  "Vinaykumar B Kandibal"
];

const ALLOWED_EMAILS = [
  "abhaypa@tricog.com",
  "adarshjayaraj@tricog.com",
  "dhiginchanikya@tricog.com",
  "mohammadrahil@tricog.com",
  "pavanc@tricog.com",
  "sunilmorries@tricog.com",
  "vinaykumarbkandibal@tricog.com"
];

const STATUS_STAGES = [
  "Problem statement",
  "Problem Discovery",
  "Solution",
  "design",
  "Development",
  "testing",
  "Deployment",
  "Users feedback"
];

const DEPARTMENTS = [
  "All Departments",
  "Algo",
  "Software",
  "Medical",
  "QA",
  "Hardware",
  "QARA",
  "Marketing",
  "Human Resource",
  "Customer Success",
  "Order Management",
  "Finance & Accounts",
  "Inside Sales",
  "Customer Support",
  "Management",
  "Inventory & Logistics",
  "Admin & Facility",
  "Product & Design",
  "Channel Management",
  "IT",
  "Product Operations",
  "Tools and Analytics",
  "SRE",
  "DE",
  "Echo Sales",
  "Sales - SME",
  "Digital Health",
  "Installation & Service",
  "Government Business",
  "Sales - LE",
  "Malaysia Business",
  "Africa Business",
  "Philippines Business",
  "Automation & Business Intelligence",
  "Clinical Research Division",
  "Draft",
  "Business Ops",
  "New Business Initiatives"
];

// Helper to style Status Badges according to Space-themed Jira guidelines
const getSpaceStatusColor = (status, isDarkMode) => {
  const norm = status.toLowerCase();
  if (norm.includes("problem") || norm.includes("statement")) {
    return isDarkMode 
      ? "text-slate-400 bg-slate-900/60 border-slate-800" 
      : "text-slate-600 bg-slate-100 border-slate-300";
  }
  if (norm.includes("solution") || norm.includes("design") || norm.includes("development")) {
    return isDarkMode 
      ? "text-[#38BDF8] bg-sky-950/40 border-sky-800/40" 
      : "text-[#0284C7] bg-sky-50 border-sky-200";
  }
  if (norm.includes("testing") || norm.includes("feedback")) {
    return isDarkMode 
      ? "text-rose-400 bg-rose-950/40 border-rose-800/40" 
      : "text-rose-600 bg-rose-50 border-rose-200";
  }
  if (norm.includes("deployment")) {
    return isDarkMode 
      ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/40" 
      : "text-emerald-600 bg-emerald-50 border-emerald-200";
  }
  return isDarkMode 
    ? "text-[#A78BFA] bg-indigo-950/40 border-indigo-800/40" 
    : "text-[#6D28D9] bg-purple-50 border-purple-200";
};

export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: normal, 1: email, 2: otp, 3: new_password
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchDashboardProjects = async () => {
    setLoading(true);
    try {
      const { data: lokkerData } = await supabase.from('lokker').select('*');
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: projectsData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

      if (projectsData && lokkerData && usersData) {
        const lokkerMap = {};
        const typesList = [];
        lokkerData.forEach(l => {
            lokkerMap[l.id] = l.label;
            if (l.category === 'type') typesList.push(l.label);
        });
        
        if (typesList.length > 0) setAvailableTypes(typesList);

        const usersMap = {};
        usersData.forEach(u => usersMap[u.user_id] = u.display_name);

        const { data: stakeholdersData } = await supabase.from('stakeholders').select('*');
        const { data: projectStakeholdersData } = await supabase.from('project_stakeholders').select('*');
        const { data: projectAttachmentsData } = await supabase.from('project_attachments').select('*');

        const shMap = {};
        if (stakeholdersData) {
            stakeholdersData.forEach(sh => shMap[sh.stakeholder_id] = sh.name);
        }

        const ticketShMap = {};
        if (projectStakeholdersData) {
            projectStakeholdersData.forEach(ps => {
                if (!ticketShMap[ps.ticket_id]) ticketShMap[ps.ticket_id] = [];
                if (shMap[ps.stakeholder_id]) {
                    ticketShMap[ps.ticket_id].push(shMap[ps.stakeholder_id]);
                }
            });
        }

        const attachmentsMap = {};
        if (projectAttachmentsData) {
            projectAttachmentsData.forEach(att => {
                if (!attachmentsMap[att.ticket_id]) attachmentsMap[att.ticket_id] = [];
                attachmentsMap[att.ticket_id].push({
                    id: att.id,
                    name: att.file_name,
                    size: att.file_size,
                    dataUrl: att.data_url
                });
            });
        }

        const mapped = projectsData.map(p => {
            let stString = '';
            if (ticketShMap[p.ticket_id] && ticketShMap[p.ticket_id].length > 0) {
                // Remove duplicates and join
                stString = [...new Set(ticketShMap[p.ticket_id])].join(', ');
            } else {
                stString = p.submitter_name || '';
            }

            return {
            projectId: p.ticket_id,
            ticketId: p.ticket_id,
            department: lokkerMap[p.department_looker_id] || p.department_looker_id || 'Unknown',
            problemStatement: p.problem_statement || '',
            projectStatus: lokkerMap[p.status_looker_id] || p.status_looker_id || 'Problem statement',
            isPublished: p.is_published,
            assignedTo: usersMap[p.assigned_user_id] || 'Unassigned',
            stakeholders: stString,
            summary: p.project_name ? {
                projectName: p.project_name,
                type: lokkerMap[p.type_looker_id] || 'Other',
                projectDescription: p.project_description || '',
                stakeholders: stString,
                meetings: [],
                outcomes: p.outcomes || [],
                attachments: attachmentsMap[p.ticket_id] || []
            } : null
        }});
        if (mapped.length > 0) {
          setProjects(mapped);
        } else {
          setProjects(INITIAL_PROJECTS);
        }
      } else {
        setProjects(INITIAL_PROJECTS);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard projects:", err);
      setProjects(INITIAL_PROJECTS);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardProjects();

    const channel = supabase
      .channel('public:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        console.log('Realtime change received!', payload);
        fetchDashboardProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default Space theme is Dark Mode
  const [availableTypes, setAvailableTypes] = useState(['Other']); // Dynamic Types
  
  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('All');

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');

  // Details Modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [modalForm, setModalForm] = useState({
    projectName: '',
    type: '',
    projectDescription: '',
    meetings: [],
    outcomes: [],
    attachments: []
  });
  
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check if current user is the specific admin allowed to change assignee values
  const canEditAssignee = useMemo(() => {
    return currentUser?.isAdmin || false;
  }, [currentUser]);

  // ==========================================
  // SIMULATED BACKEND LOOKUP FUNCTION
  // ==========================================
  const matchBackendCredentials = (email) => {
    const cleanEmail = email.toLowerCase().trim();
    
    // Strict Admin Matching Rule
    if (cleanEmail === 'adarsh@tricog.com' || cleanEmail === 'adarsh.jayaraj@tricog.com') {
      return {
        name: "Adarsh Jayaraj",
        email: cleanEmail,
        role: "Super Admin",
        isAdmin: true
      };
    }

    if (cleanEmail === 'mohammad.rahil@tricog.com') {
      return {
        name: "Mohammad Rahil",
        email: cleanEmail,
        role: "Super Admin",
        isAdmin: true
      };
    }

    // Known Team Email Mapping Rule
    const knownMails = {
      'abhay.pa@tricog.com': 'Abhay P A',
      'dhigin.chanikya@tricog.com': 'Dhigin Chanikya',
      'sunil.morries@tricog.com': 'Sunil Morries',
      'vinaykumar.b@tricog.com': 'Vinaykumar B Kandibal',
      'pavan.c@tricog.com': 'Pavan C'
    };

    if (knownMails[cleanEmail]) {
      return {
        name: knownMails[cleanEmail],
        email: cleanEmail,
        role: "Contributor",
        isAdmin: false
      };
    }

    // Fallback Dynamic Capitalization Rule
    const prefix = cleanEmail.split('@')[0];
    const formattedName = prefix
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return {
      name: formattedName || "Guest User",
      email: cleanEmail,
      role: "Contributor",
      isAdmin: false
    };
  };

  // ==========================================
  // HANDLERS
  // ==========================================
  useEffect(() => {
    const handleUserSession = async (user) => {
      // Check our fallback logic first for admin roles
      const mapped = matchBackendCredentials(user.email);
      
      // Fetch from users table to get real display_name if available
      const { data: profile } = await supabase.from('users').select('*').eq('email', user.email).single();
      
      setCurrentUser({
        ...mapped,
        name: profile?.display_name || user.user_metadata?.full_name || mapped.name,
        id: user.id
      });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      triggerToast("Please enter a valid email address");
      return;
    }



    if (!loginPassword || loginPassword.length < 6) {
      triggerToast("Password must be at least 6 characters");
      return;
    }

    if (isSignUpMode) {
      if (!loginName.trim()) {
        triggerToast("Please enter your full name");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail.trim(),
        password: loginPassword,
        options: {
          data: {
            full_name: loginName,
          }
        }
      });
      
      if (error) {
        triggerToast(error.message);
      } else {
        triggerToast("Account created! You are now logged in.");
        setIsLoginModalOpen(false);
        resetAuthStates();
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        triggerToast(error.message);
      } else {
        triggerToast("Logged in successfully!");
        setIsLoginModalOpen(false);
        resetAuthStates();
      }
    }
  };


  const resetAuthStates = () => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginName('');
    setForgotPasswordStep(0);
    setOtpToken('');
    setNewPassword('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    triggerToast("Logged out successfully");
  };

  const handleStatusChange = async (projectId, newStatus) => {
    setProjects(projects.map(p => p.projectId === projectId ? { ...p, projectStatus: newStatus } : p));
    const { data: lok } = await supabase.from('lokker').select('id').eq('label', newStatus).single();
    if (lok) {
      await supabase.from('projects').update({ status_looker_id: lok.id }).eq('ticket_id', projectId);
      triggerToast(`Status updated to ${newStatus}`);
    }
  };

  const handleAssignedToChange = async (projectId, newAssignee) => {
    if (!canEditAssignee) {
      triggerToast("Permission denied: Only an Admin can change assignments.");
      return;
    }
    // Optimistic local update
    setProjects(projects.map(p => p.projectId === projectId ? { ...p, assignedTo: newAssignee } : p));
    
    let userId = null;
    if (newAssignee !== 'Unassigned') {
        const { data: user, error: fetchUserErr } = await supabase.from('users').select('user_id').eq('display_name', newAssignee).single();
        if (user) {
          userId = user.user_id;
        } else {
          // Dynamically create the user record if they don't exist yet
          const { data: newUser, error: insertUserErr } = await supabase.from('users').insert([{ 
            display_name: newAssignee,
            email: `${newAssignee.replace(/\s+/g, '').toLowerCase()}@tricog.com`
          }]).select('user_id').single();
          
          if (newUser) {
            userId = newUser.user_id;
          } else {
            console.error("Failed to insert user:", insertUserErr);
            triggerToast(`Error creating user: ${insertUserErr?.message}`);
            return;
          }
        }
    }
    const { error: updateErr } = await supabase.from('projects').update({ assigned_user_id: userId }).eq('ticket_id', projectId);
    if (updateErr) {
      console.error("Failed to update project assignment:", updateErr);
      triggerToast(`Error assigning project: ${updateErr.message}`);
    } else {
      triggerToast(`Assigned to ${newAssignee}`);
    }
  };

  const openDetailsModal = (project) => {
    if (project.assignedTo === 'Unassigned' && !currentUser?.isAdmin) {
      triggerToast("Access denied: Please wait for the manager to assign this case.");
      return;
    }
    setActiveProjectId(project.projectId);
    setModalForm({
      projectName: project.summary?.projectName || '',
      type: project.summary?.type || '',
      projectDescription: project.summary?.projectDescription || '',
      stakeholders: project.stakeholders || project.summary?.stakeholders || '',
      meetings: project.summary?.meetings || [],
      outcomes: project.summary?.outcomes || [],
      attachments: project.summary?.attachments || []
    });
    setIsDetailsModalOpen(true);
  };

  const saveDetailsContext = async () => {
    let finalAttachments = modalForm.attachments;
    const newAttachments = modalForm.attachments.filter(a => !a.id);
    if (newAttachments.length > 0) {
        const inserts = newAttachments.map(a => ({
            ticket_id: activeProjectId,
            file_name: a.name,
            file_size: a.size,
            data_url: a.dataUrl
        }));
        const { data: inserted, error: insertErr } = await supabase.from('project_attachments').insert(inserts).select();
        if (!insertErr && inserted) {
             const insertedMapped = inserted.map(att => ({
                id: att.id,
                name: att.file_name,
                size: att.file_size,
                dataUrl: att.data_url
             }));
             finalAttachments = [
                 ...modalForm.attachments.filter(a => a.id),
                 ...insertedMapped
             ];
        } else {
             console.error("Failed to save attachments", insertErr);
        }
    }

    setProjects(projects.map(p => {
      if (p.projectId === activeProjectId) {
        return {
          ...p,
          stakeholders: modalForm.stakeholders,
          summary: {
            projectName: modalForm.projectName,
            type: modalForm.type,
            projectDescription: modalForm.projectDescription,
            stakeholders: modalForm.stakeholders,
            meetings: modalForm.meetings,
            outcomes: modalForm.outcomes,
            attachments: finalAttachments
          }
        };
      }
      return p;
    }));
    setIsDetailsModalOpen(false);
    
    let typeId = null;
    if (modalForm.type) {
      const { data: lok } = await supabase.from('lokker').select('id').eq('category', 'type').eq('label', modalForm.type).single();
      if (lok) {
          typeId = lok.id;
      } else {
          // It's a brand new type, insert it dynamically
          const { data: newLok, error: lokErr } = await supabase.from('lokker').insert([{ label: modalForm.type, category: 'type' }]).select('id').single();
          if (newLok) {
              typeId = newLok.id;
              if (!availableTypes.includes(modalForm.type)) {
                  setAvailableTypes(prev => [...prev, modalForm.type]);
              }
          } else {
              console.error("Failed to insert new type:", lokErr);
          }
      }
    }

    await supabase.from('projects').update({
        project_name: modalForm.projectName,
        project_description: modalForm.projectDescription,
        type_looker_id: typeId,
        outcomes: modalForm.outcomes
    }).eq('ticket_id', activeProjectId);

    triggerToast("Saved project details to Supabase");
  };

  const handleAddMeeting = () => {
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    
    const newMeeting = {
      id: `m_${Date.now()}`,
      timestamp: timestampStr,
      synopsis: ""
    };

    setModalForm({
      ...modalForm,
      meetings: [...modalForm.meetings, newMeeting]
    });
  };

  const handleMeetingChange = (index, value) => {
    const updatedMeetings = [...modalForm.meetings];
    updatedMeetings[index].synopsis = value;
    setModalForm({ ...modalForm, meetings: updatedMeetings });
  };

  const handleAddOutcome = () => {
    const newOutcome = {
      id: `o_${Date.now()}`,
      description: ""
    };
    setModalForm({
      ...modalForm,
      outcomes: [...modalForm.outcomes, newOutcome]
    });
  };

  const handleOutcomeChange = (index, value) => {
    const updatedOutcomes = [...modalForm.outcomes];
    updatedOutcomes[index].description = value;
    setModalForm({ ...modalForm, outcomes: updatedOutcomes });
  };

  const handleFileUploadSim = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newFile = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        dataUrl: event.target.result
      };

      setModalForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, newFile]
      }));
      triggerToast(`Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishToggle = async (project) => {
    const nextState = !project.isPublished;

    if (nextState === true) {
      if (project.projectStatus !== "Users feedback") {
        triggerToast("Publishing blocked: Project must be in 'Users feedback' status.");
        return;
      }

      const hasSummaryText = project.summary && project.summary.projectName.trim() !== '' && project.summary.projectDescription.trim() !== '';
      
      if (!hasSummaryText) {
        openDetailsModal(project);
        triggerToast("Please populate project details first");
        return;
      }
    }

    setProjects(projects.map(p => {
      if (p.projectId === project.projectId) {
        return { ...p, isPublished: nextState };
      }
      return p;
    }));

    await supabase.from('projects').update({ is_published: nextState }).eq('ticket_id', project.projectId);
    triggerToast(nextState ? `Published to Showcase` : `Removed from Showcase`);
  };

  // Pagination & Search Logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Visibility constraints: Must be logged in
      if (!currentUser) return false;
      
      // If not an admin, user can ONLY see projects assigned specifically to them or Unassigned projects.
      if (!currentUser.isAdmin && p.assignedTo !== currentUser.name && p.assignedTo !== 'Unassigned') {
        return false;
      }

      const matchDept = selectedDeptFilter === 'All Departments' || p.department === selectedDeptFilter;
      const matchTeam = selectedTeamFilter === 'All' || p.assignedTo === selectedTeamFilter;
      return matchDept && matchTeam;
    });
  }, [projects, selectedDeptFilter, selectedTeamFilter, currentUser]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const activeProject = projects.find(p => p.projectId === activeProjectId);

  return (
    <div className={`min-h-screen font-sans antialiased pb-16 transition-colors duration-300 relative overflow-hidden ${
      isDarkMode 
        ? "bg-[#03050c] bg-gradient-to-br from-[#020308] via-[#050611] to-[#0a0b16] text-[#F0F4FF]" 
        : "bg-[#F8FAFC] bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] text-[#0F172A]"
    }`}>
      
      {/* Dynamic Nebular Grid Background Layer (60%) */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,rgba(15,17,38,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,17,38,0.2)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0 ${
        isDarkMode ? "opacity-25" : "opacity-15"
      }`}></div>

      {/* ==========================================
          HEADER SECTION (ABI TEAM Space Brand - Strict Wireframe)
          ========================================== */}
      <header className={`border-b backdrop-blur-md py-5 px-8 sticky top-0 z-40 transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#03050c]/80 border-indigo-500/20" 
          : "bg-white/80 border-[#DFE1E6]"
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span 
              onClick={() => { setSelectedTeamFilter('All'); setSelectedDeptFilter('All Departments'); setCurrentPage(1); }} 
              className={`text-2xl font-black tracking-widest uppercase cursor-pointer hover:opacity-85 transition ${
                isDarkMode ? "text-[#38BDF8] hover:text-white" : "text-[#0284C7] hover:text-black"
              }`}
            >
              ABI TEAM
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button (10% Accent Highlight) */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-lg border transition-all duration-300 ${
                isDarkMode 
                  ? "bg-indigo-950/40 border-indigo-500/30 text-[#38BDF8] hover:bg-[#38BDF8]/10" 
                  : "bg-white border-[#DFE1E6] text-[#0284C7] hover:bg-[#0284C7]/10"
              }`}
              title={isDarkMode ? "Switch to Orbit Mode" : "Switch to Deep Space Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {currentUser && (
              <span className={`text-[11px] border px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                isDarkMode 
                  ? "bg-indigo-950/60 border-[#38BDF8]/20 text-indigo-200" 
                  : "bg-white border-[#DFE1E6] text-slate-700"
              }`}>
                {canEditAssignee ? <Unlock className="h-3 w-3 text-[#38BDF8]" /> : <Lock className="h-3 w-3 text-rose-500" />}
                {currentUser.name}
              </span>
            )}

            <button 
              onClick={currentUser ? handleLogout : () => setIsLoginModalOpen(true)} 
              className={`text-xs font-black uppercase tracking-widest py-2 px-5 rounded-lg border transition-all duration-300 ${
                currentUser 
                  ? "bg-transparent text-[#F43F5E] border-rose-500/30 hover:bg-rose-500/10" 
                  : isDarkMode 
                    ? "bg-transparent text-[#38BDF8] border-[#38BDF8]/40 hover:bg-[#38BDF8]/10" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-transparent"
              }`}
            >
              {currentUser ? "LOGOUT" : "LOGIN"}
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN DASHBOARD AREA
          ========================================== */}
      <main className="w-full max-w-7xl mx-auto px-8 mt-10 relative z-10">

        {/* Custom Space-Themed Glowing Toast Alert */}
        {toastMessage && (
          <div className={`fixed bottom-8 right-8 py-3.5 px-6 rounded-xl shadow-2xl z-[100] flex items-center gap-3 border animate-slide-up backdrop-blur-md ${
            isDarkMode 
              ? "bg-[#090D25]/90 text-white border-indigo-500/40" 
              : "bg-white text-[#0F172A] border-[#DFE1E6]"
          }`}>
            <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />
            <span className="text-xs font-black uppercase tracking-widest">{toastMessage}</span>
          </div>
        )}

        {/* Dashboard Title & Dynamic Filtering Dropdowns (30% secondary layout ratio) */}
        <div className={`mb-8 border-b pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDarkMode ? "border-indigo-500/20" : "border-[#DFE1E6]"
        }`}>
          <h2 className={`text-3xl font-black tracking-tight uppercase tracking-widest ${isDarkMode ? "text-white" : "text-[#0F172A]"}`}>Projects</h2>
          
          {/* Dynamic "Team" Dropdown in place of Node Fleet Metric */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <select
                value={selectedTeamFilter}
                onChange={(e) => { setSelectedTeamFilter(e.target.value); setCurrentPage(1); }}
                className={`text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer border transition-all ${
                  isDarkMode 
                    ? "bg-[#1E293B] text-[#38BDF8] border-sky-500/40 hover:bg-[#2c3d5a]" 
                    : "bg-[#F0F9FF] text-[#0284C7] border-[#B3D4FF] hover:bg-sky-100"
                }`}
              >
                <option value="All">All Team Members</option>
                {TEAM_MEMBERS.filter(m => m !== "Unassigned").map(member => (
                  <option key={member} value={member} className={isDarkMode ? "bg-[#0b0c16] text-slate-300" : "bg-white text-slate-850"}>{member}</option>
                ))}
                <option value="Unassigned" className={isDarkMode ? "bg-[#0b0c16] text-slate-300" : "bg-white text-slate-850"}>Unassigned</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDeptFilter}
                onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentPage(1); }}
                className={`text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer border transition-all ${
                  isDarkMode 
                    ? "bg-[#1E293B] text-[#38BDF8] border-sky-500/40 hover:bg-[#2c3d5a]" 
                    : "bg-[#F0F9FF] text-[#0284C7] border-[#B3D4FF] hover:bg-sky-100"
                }`}
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept} className={isDarkMode ? "bg-[#0b0c16] text-slate-300" : "bg-white text-slate-850"}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Project Roster Cards */}
        <div className="space-y-6">
          {currentTableData.length === 0 ? (
            <div className={`p-12 text-center text-xs font-bold uppercase tracking-widest border border-dashed rounded-xl ${
              isDarkMode ? "bg-[#0e1122]/60 border-indigo-500/20 text-[#94A3B8]" : "bg-white border-[#DFE1E6] text-slate-400"
            }`}>
              No matching nodes discovered in current stellar parameters.
            </div>
          ) : (
            currentTableData.map(project => {
              const hasSummary = project.summary && project.summary.projectName.trim() !== '' && project.summary.projectDescription.trim() !== '';
              
              return (
                <div 
                  key={project.projectId} 
                  className={`w-full rounded-2xl border transition-all duration-300 flex flex-col md:flex-row items-stretch ${
                    isDarkMode 
                      ? "bg-[#0e1122]/80 backdrop-blur-md border-indigo-500/20 hover:border-[#38BDF8]/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)]" 
                      : "bg-white border-[#DFE1E6] hover:border-[#0284C7]/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                  }`}
                >
                  
                  {/* Left Block: Problem Statement & Assigned To */}
                  <div className={`w-full md:w-5/12 flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r border-dashed ${
                    isDarkMode ? "border-indigo-500/20" : "border-[#DFE1E6]"
                  }`}>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${
                        isDarkMode ? "text-indigo-400" : "text-[#0284C7]"
                      }`}>Issue Problem Statement</span>
                      <p className={`text-lg font-bold tracking-tight leading-snug ${isDarkMode ? "text-slate-100" : "text-[#0F172A]"}`}>
                        {project.problemStatement}
                      </p>
                      
                      {/* Stakeholders Display */}
                      {project.stakeholders && (
                        <div className={`mt-4 pt-4 border-t border-dashed ${isDarkMode ? "border-indigo-500/20" : "border-[#DFE1E6]"}`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                            isDarkMode ? "text-indigo-400/80" : "text-[#0284C7]/80"
                          }`}>Stakeholders</span>
                          <p className={`text-sm font-semibold ${isDarkMode ? "text-indigo-200" : "text-slate-700"}`}>
                            {project.stakeholders}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                        isDarkMode ? "text-indigo-300" : "text-slate-500"
                      }`}>
                        ASSIGNED TO
                        {!canEditAssignee && <Lock className="h-3.5 w-3.5 text-slate-500" />}
                      </span>
                      <select
                        value={project.assignedTo || "Unassigned"}
                        disabled={!canEditAssignee}
                        onChange={(e) => handleAssignedToChange(project.projectId, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          canEditAssignee 
                            ? isDarkMode 
                              ? "bg-[#1E293B] text-[#38BDF8] border-sky-500/40 hover:bg-[#2c3d5a] cursor-pointer" 
                              : "bg-[#F0F9FF] text-[#0284C7] border-[#B3D4FF] hover:bg-sky-100 cursor-pointer"
                            : isDarkMode 
                              ? "bg-[#0b0c16] text-slate-500 border-indigo-500/10 cursor-not-allowed opacity-80"
                              : "bg-[#F1F5F9] text-slate-400 border-[#E2E8F0] cursor-not-allowed opacity-80"
                        }`}
                      >
                        {TEAM_MEMBERS.map(member => (
                          <option key={member} value={member} className={isDarkMode ? "bg-[#0b0c16] text-slate-300" : "bg-white text-slate-800"}>{member}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Center Block: Details Button (Wireframe 1 Center Point - 10% Accent) */}
                  <div className={`w-full md:w-3/12 flex items-center justify-center p-6 ${
                    isDarkMode ? "bg-[#03050c]/40" : "bg-[#F8FAFC]"
                  }`}>
                    <button
                      onClick={() => openDetailsModal(project)}
                      className={`w-full max-w-[210px] font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl flex items-center justify-between border transition-all duration-300 ${
                        hasSummary 
                          ? 'bg-[#064E3B] text-[#34D399] border-emerald-500/30 hover:bg-[#064E3B]/80 hover:shadow-[0_0_10px_rgba(52,211,153,0.15)]' 
                          : isDarkMode 
                            ? 'bg-[#0b0c16] text-[#38BDF8] border-[#38BDF8]/20 hover:bg-[#38BDF8]/10 hover:text-white'
                            : 'bg-white text-[#0284C7] border-[#0284C7]/30 hover:bg-[#0284C7]/5'
                      }`}
                    >
                      <span>{hasSummary ? "Details [Saved]" : "Details"}</span>
                      <ChevronDown className="h-4 w-4 stroke-[3] text-current" />
                    </button>
                  </div>

                  {/* Right Block: Grid Layout exactly following Wireframe 1 */}
                  <div className="w-full md:w-4/12 flex flex-col justify-between p-6">
                    
                    {/* Top Right: department | ticket id */}
                    <div className="flex items-center justify-end gap-3.5 w-full">
                      <span className={`font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded border ${
                        isDarkMode 
                          ? "text-indigo-300 bg-indigo-950/40 border-indigo-500/20" 
                          : "text-slate-600 bg-slate-100 border-[#DFE1E6]"
                      }`}>
                        {project.department}
                      </span>
                      <span className="font-bold text-slate-400">|</span>
                      <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded border ${
                        isDarkMode 
                          ? "text-[#38BDF8] bg-[#141527] border-indigo-500/30" 
                          : "text-[#0052CC] bg-[#DEEBFF] border-[#B3D4FF]"
                      }`}>
                        {project.ticketId}
                      </span>
                    </div>

                    {/* Bottom Right: status Publish */}
                    <div className={`flex items-center justify-end gap-5 w-full mt-6 pt-3 border-t ${
                      isDarkMode ? "border-indigo-500/10" : "border-[#DFE1E6]"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-[#94A3B8]" : "text-slate-500"}`}>status</span>
                        <select
                          value={project.projectStatus}
                          onChange={(e) => handleStatusChange(project.projectId, e.target.value)}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer border transition-all ${getSpaceStatusColor(project.projectStatus, isDarkMode)}`}
                        >
                          {STATUS_STAGES.map(stage => (
                            <option key={stage} value={stage} className={isDarkMode ? "bg-[#0b0c16] text-slate-300" : "bg-white text-slate-850"}>{stage}</option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={() => handlePublishToggle(project)}
                        className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                          project.isPublished 
                            ? "text-emerald-400 bg-[#064E3B] border-emerald-500/40 hover:bg-[#064E3B]/80" 
                            : isDarkMode 
                              ? "text-slate-400 bg-[#0b0c16] border-indigo-500/20 hover:bg-indigo-950 hover:text-white"
                              : "text-[#0284C7] bg-white border-[#0284C7]/20 hover:bg-sky-50"
                        }`}
                      >
                        {project.isPublished ? "Published" : "Publish"}
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Wireframe Centered Pagination - Space Edition */}
        <div className="mt-14 flex flex-col items-center justify-center gap-2">
          <span className={`text-xs font-black uppercase tracking-widest flex items-center ${isDarkMode ? "text-[#94A3B8]" : "text-slate-500"}`}>
            Page No &lt; 
            <span className="mx-3 flex gap-1 items-center">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-2 py-1 text-sm font-extrabold transition-all ${
                    currentPage === i + 1 
                      ? isDarkMode 
                        ? 'text-[#38BDF8] scale-125 underline decoration-2 underline-offset-4 font-black shadow-[#38BDF8]/20 shadow-sm' 
                        : 'text-[#0284C7] scale-125 underline decoration-2 underline-offset-4 font-black shadow-[#0284C7]/20 shadow-sm' 
                      : 'text-slate-500 hover:text-[#38BDF8] hover:scale-110'
                  }`}
                >
                  {i + 1}
                  {i + 1 < totalPages && <span className="text-indigo-500/40 ml-2 font-normal">,</span>}
                </button>
              ))}
            </span>
            &gt;
          </span>
        </div>

      </main>

      {/* ==========================================
          MODAL: DETAILS WORKSPACE (Wireframe 2 - Holographic Space Station Panel)
          ========================================== */}
      {isDetailsModalOpen && activeProject && (
        <div className="fixed inset-0 bg-[#03050c]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border-2 w-full max-w-4xl max-h-[88vh] overflow-y-auto shadow-2xl rounded-3xl p-8 md:p-10 relative transition-colors duration-300 animate-scale-up ${
            isDarkMode 
              ? "bg-[#0e1122] border-indigo-500/30 text-slate-100 shadow-[0_0_50px_rgba(99,102,241,0.15)]" 
              : "bg-white border-[#DFE1E6] text-[#0F172A]"
          }`}>
            
            {/* Close trigger button */}
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl transition-all hover:bg-slate-500/10 text-slate-400 hover:text-current"
            >
              <X className="h-6 w-6 stroke-[3]" />
            </button>

            {/* Top Row: ticket id, status box, Department, Publish (Exactly Wireframe 2) */}
            <div className={`flex flex-wrap items-center justify-between gap-6 pb-6 mb-8 mt-2 border-b ${
              isDarkMode ? "border-indigo-500/20" : "border-[#DFE1E6]"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>ticket id</span>
                <span className={`font-mono text-sm font-black px-3.5 py-1 rounded border ${
                  isDarkMode 
                    ? "bg-[#141527] text-[#38BDF8] border-indigo-500/30" 
                    : "bg-[#DEEBFF] text-[#0052CC] border-[#B3D4FF]"
                }`}>
                  {activeProject.ticketId}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Status</span>
                <select
                  value={activeProject.projectStatus}
                  onChange={(e) => handleStatusChange(activeProject.projectId, e.target.value)}
                  className={`text-xs font-bold rounded-lg px-3.5 py-1.5 focus:outline-none cursor-pointer border ${getSpaceStatusColor(activeProject.projectStatus, isDarkMode)}`}
                >
                  {STATUS_STAGES.map(stage => (
                    <option key={stage} value={stage} className={isDarkMode ? "bg-[#0b0c16] text-slate-300" : "bg-white text-slate-850"}>{stage}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Department</span>
                <span className={`text-xs font-extrabold px-3.5 py-1.5 rounded border uppercase tracking-widest ${
                  isDarkMode 
                    ? "bg-[#141527] border-indigo-500/20 text-[#F0F4FF]" 
                    : "bg-slate-100 border-[#DFE1E6] text-slate-700"
                }`}>
                  {activeProject.department}
                </span>
              </div>

              <button 
                onClick={() => handlePublishToggle(activeProject)} 
                className={`text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-lg border transition-all ${
                  activeProject.isPublished 
                    ? "text-emerald-400 bg-[#064E3B] border-emerald-500/40" 
                    : isDarkMode 
                      ? "text-slate-400 bg-transparent border-indigo-500/20 hover:border-indigo-500/40" 
                      : "text-slate-500 bg-transparent border-[#DFE1E6] hover:bg-slate-50"
                }`}
              >
                {activeProject.isPublished ? "Published" : "Publish"}
              </button>
            </div>

            {/* Row 2: Project name & Type (Exactly Wireframe 2) */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex-1">
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Project name</label>
                <input 
                  type="text"
                  value={modalForm.projectName}
                  onChange={(e) => setModalForm({...modalForm, projectName: e.target.value})}
                  className={`w-full border h-11 px-4 rounded-lg text-sm font-semibold focus:outline-none transition-all ${
                    isDarkMode 
                      ? "bg-[#03050c] border-indigo-500/20 hover:border-[#38BDF8]/40 focus:border-[#38BDF8] text-white focus:bg-[#03050c]/80 focus:shadow-[0_0_15px_rgba(56,189,248,0.1)]" 
                      : "bg-[#F8FAFC] border-[#DFE1E6] hover:border-[#0284C7]/40 focus:border-[#0284C7] text-slate-800 focus:bg-white"
                  }`} 
                  placeholder="System Project Node Name"
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Type</label>
                <input 
                  type="text"
                  list="type-options"
                  value={modalForm.type}
                  placeholder="e.g. Service Migration"
                  onChange={(e) => setModalForm({...modalForm, type: e.target.value})}
                  className={`w-full border h-11 px-4 rounded-lg text-sm font-semibold focus:outline-none transition-all ${
                    isDarkMode 
                      ? "bg-[#03050c] border-indigo-500/20 hover:border-[#38BDF8]/40 focus:border-[#38BDF8] text-white focus:bg-[#03050c]/80" 
                      : "bg-[#F8FAFC] border-[#DFE1E6] hover:border-[#0284C7]/40 focus:border-[#0284C7] text-slate-800 focus:bg-white"
                  }`} 
                />
                <datalist id="type-options">
                  {availableTypes.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Row 3: problem statement (Exactly Wireframe 2) */}
            <div className="mb-6">
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>problem statement</label>
              <div className={`w-full rounded-lg border px-4 py-3 text-xs font-semibold leading-relaxed ${
                isDarkMode 
                  ? "bg-[#03050c]/80 border-indigo-500/20 text-slate-300" 
                  : "bg-[#F8FAFC] border-[#DFE1E6] text-slate-600"
              }`}>
                {activeProject.problemStatement}
              </div>
            </div>

            {/* Row 3.5: Stakeholders */}
            <div className="mb-6">
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>
                Stakeholders
              </label>
              <div className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                isDarkMode 
                  ? "bg-[#03050c]/80 border-indigo-500/10 text-slate-400 cursor-not-allowed" 
                  : "bg-[#F1F5F9] border-[#E2E8F0] text-slate-500 cursor-not-allowed"
              }`}>
                {modalForm.stakeholders || "No stakeholders assigned"}
              </div>
            </div>

            {/* Row 4: Description (Exactly Wireframe 2) */}
            <div className="mb-8">
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Description</label>
              <textarea 
                value={modalForm.projectDescription}
                onChange={(e) => setModalForm({...modalForm, projectDescription: e.target.value})}
                placeholder="Operational approach taken to address the core problem..."
                rows={4}
                className={`w-full border px-4 py-3 rounded-lg text-sm font-semibold focus:outline-none resize-none transition-all ${
                  isDarkMode 
                    ? "bg-[#03050c] border-indigo-500/20 hover:border-[#38BDF8]/40 focus:border-[#38BDF8] text-white focus:bg-[#03050c]/80 focus:shadow-[0_0_15px_rgba(56,189,248,0.1)]" 
                    : "bg-[#F8FAFC] border-[#DFE1E6] hover:border-[#0284C7]/40 focus:border-[#0284C7] text-slate-800 focus:bg-white"
                }`} 
              />
            </div>

            {/* Row 4.5: Assigned Lead Developer */}
            <div className="mb-8">
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>
                Assigned Lead Developer
                {!canEditAssignee && <Lock className="h-3.5 w-3.5 text-rose-500" />}
              </label>
              <select
                value={activeProject.assignedTo || "Unassigned"}
                disabled={!canEditAssignee}
                onChange={(e) => handleAssignedToChange(activeProject.projectId, e.target.value)}
                className={`text-xs font-bold rounded-lg px-3.5 py-2 border transition-all ${
                  canEditAssignee 
                    ? isDarkMode 
                      ? "bg-[#1E293B] text-[#38BDF8] border-sky-500/40 hover:bg-[#334155] cursor-pointer" 
                      : "bg-[#F0F9FF] text-[#0284C7] border-[#B3D4FF] hover:bg-sky-100 cursor-pointer"
                    : isDarkMode 
                      ? "bg-[#03050c] text-slate-500 border-indigo-500/10 cursor-not-allowed opacity-85" 
                      : "bg-[#F1F5F9] text-slate-400 border-[#E2E8F0] cursor-not-allowed opacity-85"
                }`}
              >
                {TEAM_MEMBERS.map(member => (
                  <option key={member} value={member} className={isDarkMode ? "bg-[#0b0c16] text-slate-300" : "bg-white text-slate-800"}>{member}</option>
                ))}
              </select>
            </div>

            {/* Row 5: Meetings overview (Exactly Wireframe 2) */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Meetings overview</label>
                <button 
                  onClick={handleAddMeeting} 
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-lg transition-all focus:outline-none border ${
                    isDarkMode 
                      ? "bg-indigo-950 text-[#38BDF8] hover:bg-indigo-900 border-indigo-500/30 hover:shadow-[0_0_10px_rgba(56,189,248,0.3)]" 
                      : "bg-sky-100 text-[#0284C7] hover:bg-sky-200 border-sky-300"
                  }`}
                  title="Add timeline sync row"
                >
                  +
                </button>
              </div>
              
              <div className="space-y-3">
                {modalForm.meetings.map((m, idx) => (
                  <div key={m.id} className={`flex flex-col md:flex-row items-stretch rounded-lg border overflow-hidden shadow-sm ${
                    isDarkMode ? "border-indigo-500/20" : "border-[#DFE1E6]"
                  }`}>
                    <div className={`px-4 py-2 flex items-center font-mono text-xs font-bold border-r min-w-[190px] ${
                      isDarkMode 
                        ? "bg-[#03050c] text-indigo-300 border-indigo-500/20" 
                        : "bg-[#F8FAFC] text-slate-600 border-[#DFE1E6]"
                    }`}>
                      {m.timestamp}
                    </div>
                    <input 
                      value={m.synopsis}
                      onChange={(e) => handleMeetingChange(idx, e.target.value)}
                      placeholder="Enter meeting synopsis details..."
                      className={`flex-grow px-4 py-3 text-xs font-semibold focus:outline-none ${
                        isDarkMode 
                          ? "bg-[#0c0d1b] text-slate-200 focus:bg-[#03050c] placeholder-slate-500" 
                          : "bg-white text-slate-800 placeholder-slate-400"
                      }`} 
                    />
                  </div>
                ))}
                {modalForm.meetings.length === 0 && (
                  <div className={`border border-dashed rounded-lg p-5 text-center text-xs font-bold uppercase tracking-widest ${
                    isDarkMode ? "bg-[#03050c]/40 border-indigo-500/10 text-[#94A3B8]" : "bg-slate-50 border-[#DFE1E6] text-slate-400"
                  }`}>
                    No sync coordinates logged. Add a timeline point using the "+" module.
                  </div>
                )}
              </div>
            </div>

            {/* Row 5.5: Outcomes overview */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Outcomes overview</label>
                <button 
                  onClick={handleAddOutcome} 
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-lg transition-all focus:outline-none border ${
                    isDarkMode 
                      ? "bg-indigo-950 text-[#38BDF8] hover:bg-indigo-900 border-indigo-500/30 hover:shadow-[0_0_10px_rgba(56,189,248,0.3)]" 
                      : "bg-sky-100 text-[#0284C7] hover:bg-sky-200 border-sky-300"
                  }`}
                  title="Add outcome point"
                >
                  +
                </button>
              </div>
              
              <div className="space-y-3">
                {modalForm.outcomes.map((o, idx) => (
                  <div key={o.id} className={`flex flex-col md:flex-row items-stretch rounded-lg border overflow-hidden shadow-sm ${
                    isDarkMode ? "border-indigo-500/20" : "border-[#DFE1E6]"
                  }`}>
                    <div className={`px-4 py-2 flex items-center justify-center font-mono text-xs font-bold border-r w-12 ${
                      isDarkMode 
                        ? "bg-[#03050c] text-indigo-300 border-indigo-500/20" 
                        : "bg-[#F8FAFC] text-slate-600 border-[#DFE1E6]"
                    }`}>
                      {idx + 1}
                    </div>
                    <input 
                      value={o.description}
                      onChange={(e) => handleOutcomeChange(idx, e.target.value)}
                      placeholder="Enter outcome details..."
                      className={`flex-grow px-4 py-3 text-xs font-semibold focus:outline-none ${
                        isDarkMode 
                          ? "bg-[#0c0d1b] text-slate-200 focus:bg-[#03050c] placeholder-slate-500" 
                          : "bg-white text-slate-800 placeholder-slate-400"
                      }`} 
                    />
                  </div>
                ))}
                {modalForm.outcomes.length === 0 && (
                  <div className={`border border-dashed rounded-lg p-5 text-center text-xs font-bold uppercase tracking-widest ${
                    isDarkMode ? "bg-[#03050c]/40 border-indigo-500/10 text-[#94A3B8]" : "bg-slate-50 border-[#DFE1E6] text-slate-400"
                  }`}>
                    No outcomes logged. Add a point using the "+" module.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Attach files & Save (Exactly Wireframe 2) */}
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-10 pt-6 border-t ${
              isDarkMode ? "border-indigo-500/20" : "border-[#DFE1E6]"
            }`}>
              
              <div className="flex flex-col gap-2.5">
                <label className={`flex items-center gap-2 cursor-pointer text-xs font-bold px-3.5 py-2.5 rounded-lg border transition-all w-fit ${
                  isDarkMode 
                    ? "text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30" 
                    : "text-[#0284C7] bg-[#F0F9FF] hover:bg-sky-100 border-[#B3D4FF]"
                }`}>
                  <Paperclip className="h-4 w-4" />
                  <span>Attach specifications</span>
                  <input type="file" className="hidden" onChange={handleFileUploadSim} />
                </label>
                
                <div className="flex flex-wrap gap-2">
                  {modalForm.attachments.map((file, idx) => (
                    <span key={idx} className={`text-xs border px-2.5 py-1.5 rounded flex items-center gap-1.5 font-mono cursor-pointer transition-colors ${
                      isDarkMode 
                        ? "bg-[#03050c] border-indigo-500/20 text-slate-300 hover:border-[#38BDF8]/40" 
                        : "bg-slate-50 border-[#DFE1E6] text-slate-600 hover:border-[#0284C7]/40"
                    }`} onClick={() => {
                        if (file.dataUrl) {
                            const newWindow = window.open("");
                            if (newWindow) {
                                newWindow.document.write(`<iframe src="${file.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                        }
                    }}>
                      <FileText className="h-3 w-3 text-[#38BDF8]" />
                      {file.name} ({file.size})
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newAttachments = [...modalForm.attachments];
                          const removed = newAttachments.splice(idx, 1)[0];
                          if (removed.id) {
                              await supabase.from('project_attachments').delete().eq('id', removed.id);
                          }
                          setModalForm({...modalForm, attachments: newAttachments});
                        }}
                        className="ml-1.5 rounded-full hover:bg-red-500/20 text-red-500/70 hover:text-red-500 transition-colors p-0.5 focus:outline-none"
                        title="Remove attachment"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Stark, bold save CTA (10% Accent) */}
              <button 
                onClick={saveDetailsContext} 
                className={`w-full sm:w-auto font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-lg transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-[#0284C7] to-indigo-600 hover:from-[#0284C7]/80 hover:to-indigo-500/80 text-white shadow-indigo-500/10 hover:shadow-indigo-500/20" 
                    : "bg-[#0284C7] hover:bg-[#0284C7]/90 text-white shadow-sky-500/10 hover:shadow-sky-500/20"
                }`}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: GOOGLE SIGN-IN INTERACTIVE POPUP (Clean Layout)
          ========================================== */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-[#020308]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border animate-scale-up ${
            isDarkMode 
              ? "bg-[#0e1122]/95 border-indigo-500/30 shadow-[0_0_40px_rgba(56,189,248,0.15)] text-slate-100" 
              : "bg-white border-[#DFE1E6] text-slate-800"
          }`}>
            
            {/* Google-Style Header Banner */}
            <div className={`p-6 border-b flex flex-col items-center text-center ${
              isDarkMode ? "border-indigo-500/20 bg-[#03050c]/80" : "border-[#DFE1E6] bg-slate-50"
            }`}>
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {forgotPasswordStep > 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3.286l7.425-7.425A6 6 0 1115 7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  )}
                </svg>
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                {isSignUpMode ? "Join the workspace" : "Sign in to workspace"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter your credentials to access the dashboard
              </p>
            </div>

              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                {isSignUpMode && (
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Full Name</label>
                    <input 
                      type="text"
                      required={isSignUpMode}
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="Adarsh Jayaraj"
                      className={`w-full border h-11 px-4 rounded-lg text-sm font-semibold focus:outline-none transition-all ${
                        isDarkMode 
                          ? "bg-[#03050c] border-indigo-500/20 hover:border-[#38BDF8]/40 focus:border-[#38BDF8] text-white" 
                          : "bg-[#F8FAFC] border-[#DFE1E6] hover:border-[#0284C7]/40 focus:border-[#0284C7] text-slate-800"
                      }`}
                    />
                  </div>
                )}
                
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Email address</label>
                  <input 
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@tricog.com"
                    className={`w-full border h-11 px-4 rounded-lg text-sm font-semibold focus:outline-none transition-all ${
                      isDarkMode 
                        ? "bg-[#03050c] border-indigo-500/20 hover:border-[#38BDF8]/40 focus:border-[#38BDF8] text-white" 
                        : "bg-[#F8FAFC] border-[#DFE1E6] hover:border-[#0284C7]/40 focus:border-[#0284C7] text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-indigo-300" : "text-slate-500"}`}>Password</label>
                  </div>
                  <input 
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full border h-11 px-4 rounded-lg text-sm font-semibold focus:outline-none transition-all ${
                      isDarkMode 
                        ? "bg-[#03050c] border-indigo-500/20 hover:border-[#38BDF8]/40 focus:border-[#38BDF8] text-white" 
                        : "bg-[#F8FAFC] border-[#DFE1E6] hover:border-[#0284C7]/40 focus:border-[#0284C7] text-slate-800"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-lg text-xs uppercase tracking-widest transition shadow-sm flex items-center justify-center gap-2"
                >
                  {isSignUpMode ? "Create Account" : "Sign In"}
                </button>

                <div className="flex flex-col gap-3 text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => { setIsSignUpMode(!isSignUpMode); setLoginPassword(''); }}
                    className="text-xs font-bold text-[#38BDF8] hover:text-[#0ea5e9] transition"
                  >
                    {isSignUpMode ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setIsLoginModalOpen(false); resetAuthStates(); }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>

          </div>
        </div>
      )}

    </div>
  );
} 
