import { useState } from "react";
import { 
  Users, 
  Shield, 
  History, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  AlertCircle,
  Activity,
  Briefcase,
  Settings,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useGetUsersQuery, 
  useUpdateUserRoleMutation, 
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetAuditLogsQuery,
  useGetAdminProjectsQuery,
  useDeleteAdminProjectMutation,
  useGetAdminRequestsQuery
} from "../../store/api/adminApiSlice";
import { DASHBOARD_ROLES } from "../../lib/constants";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'projects', 'requests', 'logs', 'system'
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: userData, isLoading: loadingUsers } = useGetUsersQuery({ page, search });
  const { data: logData, isLoading: loadingLogs } = useGetAuditLogsQuery({ page: 1 });
  const { data: projectData, isLoading: loadingProjects } = useGetAdminProjectsQuery({ page, search }, { skip: activeTab !== 'projects' });
  const { data: requestData, isLoading: loadingRequests } = useGetAdminRequestsQuery({ page }, { skip: activeTab !== 'requests' });

  const [updateRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();
  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteAdminProjectMutation();

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await updateRole({ id: userId, role: newRole }).unwrap();
      } catch (err) {
        console.error("Failed to update role:", err);
      }
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    if (window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this user?`)) {
      try {
        await updateStatus({ id: userId, status: newStatus }).unwrap();
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this user? This action cannot be undone.")) {
      try {
        await deleteUser(userId).unwrap();
      } catch (err) {
        console.error("Failed to delete user:", err);
      }
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this project globally?")) {
      try {
        await deleteProject(projectId).unwrap();
      } catch (err) {
        console.error("Failed to delete project:", err);
      }
    }
  };

  return (
    <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 selection:bg-primary/30">
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Admin Terminal</h1>
        </div>
        <p className="text-muted-foreground font-medium max-w-2xl">
          System-wide governance and monitoring. Manage user permissions, audit operational logs, and oversee platform integrity.
        </p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted/30 rounded-[2rem] border border-border/50 w-fit mb-12">
        {[
          { id: "users", label: "User Management", icon: Users },
          { id: "projects", label: "Global Projects", icon: Briefcase },
          { id: "requests", label: "Approval Requests", icon: ShieldAlert },
          { id: "logs", label: "Audit Logs", icon: History },
          { id: "system", label: "Global Settings", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activeTab === tab.id 
                ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search by identity or transmission..."
                  className="w-full pl-12 pr-4 py-4 bg-card/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary px-6 py-4 flex items-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  <Filter size={14} /> Refine View
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">User Node</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status / Role</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Engagement</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loadingUsers ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-8 py-10 h-24 bg-muted/10"></td>
                        </tr>
                      ))
                    ) : (
                      userData?.users?.map((user) => (
                        <tr key={user._id} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border/50">
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-black text-sm tracking-tight text-foreground">{user.username}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider">{user.email || 'No email synced'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <select
                              value={user.role}
                              disabled={isUpdating}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:border-primary/30 transition-all"
                            >
                              {DASHBOARD_ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">XP Level</p>
                                <p className="text-xs font-black text-foreground">LVL {user.level} <span className="text-[10px] text-muted-foreground/50 ml-1">({user.xp} XP)</span></p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Reputation</p>
                                <p className="text-xs font-black text-indigo-500">{user.reputationScore}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  if(window.confirm(`Are you sure you want to ${user.status === 'Blocked' ? 'unblock' : 'block'} this user?`)) {
                                    /* We will need to define toggleStatus mutation */
                                    // toggleStatus({ id: user._id, status: user.status === 'Blocked' ? 'Active' : 'Blocked' });
                                  }
                                }}
                                className={`p-3 rounded-xl transition-all ${user.status === 'Blocked' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500'}`}
                                title={user.status === 'Blocked' ? "Unblock User" : "Block User"}
                              >
                                <ShieldAlert size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  if(window.confirm("Are you sure you want to permanently delete this user?")) {
                                    /* deleteUser mutation */
                                    // deleteUser(user._id);
                                  }
                                }}
                                className="p-3 rounded-xl bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                                title="Delete User"
                              >
                                <Users size={16} /> {/* Should use Trash icon */}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-8 py-6 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Displaying {userData?.users?.length} of {userData?.totalUsers} identity nodes
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 rounded-lg bg-background border border-border/50 text-muted-foreground hover:text-primary disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    disabled={page >= userData?.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded-lg bg-background border border-border/50 text-muted-foreground hover:text-primary disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "projects" && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Project Name</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Owner</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status / Difficulty</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loadingProjects ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-8 py-10 h-24 bg-muted/10"></td>
                        </tr>
                      ))
                    ) : (
                      projectData?.projects?.map((proj) => (
                        <tr key={proj._id} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-8 py-6">
                            <p className="font-black text-sm tracking-tight text-foreground">{proj.title}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider mt-1">{proj.bounty} XP Bounty</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <img src={proj.owner?.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              <span className="text-xs font-black">{proj.owner?.username}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-md border font-black text-[9px] uppercase tracking-widest bg-primary/10 text-primary border-primary/20 mr-2">
                              {proj.status}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground">{proj.difficulty}</span>
                          </td>
                          <td className="px-8 py-6">
                            <button 
                              onClick={() => handleDeleteProject(proj._id)}
                              disabled={isDeletingProject}
                              className="p-3 rounded-xl bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                              title="Delete Project"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Type</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Project</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Requested By</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loadingRequests ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-8 py-10 h-24 bg-muted/10"></td>
                        </tr>
                      ))
                    ) : (
                      requestData?.requests?.map((req) => (
                        <tr key={req._id} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-8 py-6">
                            <p className="font-black text-sm tracking-tight text-foreground">{req.type}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-black text-muted-foreground">{req.project?.title || 'Unknown'}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <img src={req.requestedBy?.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              <span className="text-xs font-black">{req.requestedBy?.username}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            {req.status === 'Pending' ? (
                              <span className="px-3 py-1 rounded-md border font-black text-[9px] uppercase tracking-widest bg-yellow-500/10 text-yellow-600 border-yellow-500/20 flex items-center gap-1 w-fit">
                                <Clock size={12} /> Pending
                              </span>
                            ) : req.status === 'Approved' ? (
                              <span className="px-3 py-1 rounded-md border font-black text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 w-fit">
                                <CheckCircle2 size={12} /> Approved
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-md border font-black text-[9px] uppercase tracking-widest bg-red-500/10 text-red-500 border-red-500/20 w-fit">
                                Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "logs" && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
                  <Activity size={20} className="text-primary" />
                  Live Operational Stream
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Link Stable
                </div>
              </div>
              <div className="divide-y divide-border/30">
                {loadingLogs ? (
                   [...Array(8)].map((_, i) => (
                    <div key={i} className="p-8 animate-pulse bg-muted/10 h-20"></div>
                  ))
                ) : (
                  logData?.logs?.map((log) => (
                    <div key={log._id} className="p-8 hover:bg-muted/10 transition-colors flex items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border/50 shrink-0">
                          {log.action.includes('USER') ? <Users size={16} /> : <Briefcase size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-foreground tracking-tight">{log.actor?.username || 'System'}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">•</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{log.action}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">Modified resource <span className="text-foreground">{log.resource}</span> ({log.resourceId})</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        <p className="text-[9px] font-bold text-muted-foreground opacity-40">{new Date(log.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "system" && (
          <motion.div
            key="system"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-card border border-border/50 rounded-[2.5rem] p-12">
              <h3 className="text-xl font-black mb-6 tracking-tight">Security Protocols</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">Configure global authentication scopes and security headers for the platform API.</p>
              <div className="space-y-6">
                {[
                  { label: "Zero-Trust Enforcement", enabled: true },
                  { label: "Real-time Sync Channel", enabled: true },
                  { label: "Public Registration", enabled: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-muted/30 rounded-3xl border border-border/50">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{s.label}</span>
                    <div className={`w-12 h-6 rounded-full relative p-1 transition-colors ${s.enabled ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${s.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
