import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowRight, Globe, Tag, Sparkles } from 'lucide-react';

const IDEAS_DB = [
    {
        category: "Artificial Intelligence & Enterprise SaaS",
        ideas: [
            {
                title: "Autonomous WhatsApp B2B Sales SDR",
                desc: "Voice and chat AI agents that qualify inbound dealer inquiries, query live inventory in Tally/Zoho, and generate instant purchase orders over WhatsApp.",
                icon: "💬",
                industry: "Enterprise B2B SaaS",
                geo: "India",
                segment: "Distributors & FMCG Brands"
            },
            {
                title: "AI Contract Redliner for Indian Law",
                desc: "Domain-adapted legal intelligence trained on Indian Contract Act, DPDP 2023, and GST rules to redline vendor agreements in under 60 seconds.",
                icon: "⚖️",
                industry: "LegalTech & AI",
                geo: "India",
                segment: "Corporate Legal & Startups"
            },
            {
                title: "Cloud GPU Cluster Scheduler for AI Labs",
                desc: "Multi-cloud spot GPU orchestrator that harvests idle H100 capacity, auto-checkpoints weights, and slashes model training costs by 45%.",
                icon: "🧠",
                industry: "Developer Infra & AI",
                geo: "Global",
                segment: "AI Labs & Growth Startups"
            },
            {
                title: "Autonomous Code Migration for Legacy Banking",
                desc: "Specialized code translation agent converting COBOL and legacy Java 6 banking engines to audited modern Go microservices.",
                icon: "🏛️",
                industry: "Enterprise SaaS",
                geo: "Global",
                segment: "Tier-1 Banks & NBFCs"
            },
        ]
    },
    {
        category: "Fintech, Cross-Border Trade & Compliance",
        ideas: [
            {
                title: "Cross-Border Trade OS for MSME Exporters",
                desc: "Single-window compliance, automated customs classification, FX hedging, and digital bill-of-lading for Indian apparel and handicraft exporters.",
                icon: "🚢",
                industry: "Fintech & Supply Chain",
                geo: "India",
                segment: "MSME Exporters"
            },
            {
                title: "Embedded Invoice Factoring for Subcontractors",
                desc: "Real-time GST invoice verification and automated 48-hour working capital liquidity for tier-2 infrastructure contractors.",
                icon: "🧾",
                industry: "Fintech",
                geo: "India",
                segment: "Infrastructure Contractors"
            },
            {
                title: "Chit Fund & Rotating Savings Digitization",
                desc: "Compliant mobile ledger automating KYC, auction bidding, and direct UPI settlement for registered neighborhood chit funds.",
                icon: "💰",
                industry: "Fintech",
                geo: "India",
                segment: "Tier-2/3 Savers & Promoters"
            },
            {
                title: "Cross-Border Payroll for Remote Indian Engineers",
                desc: "FEMA-compliant EOR (Employer of Record) providing rupee remittances, EPF/health insurance, and dual-country tax filing.",
                icon: "🌐",
                industry: "HRTech & Fintech",
                geo: "India",
                segment: "Remote Global Tech Talent"
            },
        ]
    },
    {
        category: "HealthTech & Clinical Automation",
        ideas: [
            {
                title: "AI Medical Coding & TPA Pre-Auth",
                desc: "Autonomous workflow ingesting hospital discharge papers, mapping ICD-10/CPT codes, and submitting insurance claims to eliminate rejection delays.",
                icon: "🩺",
                industry: "HealthTech & AI",
                geo: "India",
                segment: "Private Hospitals & TPAs"
            },
            {
                title: "Vernacular Clinical Ambient Scribe",
                desc: "Ambient listening assistant fluent in code-switching (Hinglish/Tamil/Telugu) converting high-volume OPD consultations into structured EMR records.",
                icon: "🎙️",
                industry: "HealthTech & AI",
                geo: "India",
                segment: "Tier-2/3 OPD Clinicians"
            },
            {
                title: "Generic Medicine Substitution Finder",
                desc: "B2B pharmacy procurement app matching branded molecule prescriptions with verified low-cost Jan Aushadhi generic equivalents.",
                icon: "💊",
                industry: "HealthTech",
                geo: "India",
                segment: "Retail Pharmacies & Patients"
            },
            {
                title: "Elderly Post-Op Remote Vitals Monitoring",
                desc: "Cellular-connected non-invasive patch and clinical escalation concierge for post-cardiac surgery recovery at home.",
                icon: "👵",
                industry: "HealthTech & IoT",
                geo: "India",
                segment: "Geriatric Patients & Hospitals"
            },
        ]
    },
    {
        category: "CleanTech, Energy & Mobility",
        ideas: [
            {
                title: "EV Battery Telematics & 2nd-Life Grid",
                desc: "IoT battery health diagnostic platform offering real-time state-of-health tracking, swap management, and secondary energy storage recycling for fleets.",
                icon: "⚡",
                industry: "CleanTech & EV Mobility",
                geo: "India",
                segment: "Commercial Fleet Operators"
            },
            {
                title: "Decentralized Rooftop Solar Financing",
                desc: "Underwriting engine and remote IoT energy generation monitoring enabling low-friction debt financing for factory rooftop solar plants.",
                icon: "☀️",
                industry: "Climate Fintech",
                geo: "India",
                segment: "C&I Factory Owners"
            },
            {
                title: "Carbon Audit & ESG Reporting for Textile Mills",
                desc: "Automated energy sensor aggregation and water footprint tracking for apparel exporters subject to EU Carbon Border Adjustment (CBAM).",
                icon: "🌿",
                industry: "ClimateTech SaaS",
                geo: "India",
                segment: "Textile Mills & Exporters"
            },
            {
                title: "E-Rickshaw Fleet Operations & Swapping OS",
                desc: "Integrated telematics, driver lease underwriting, and battery swap network coordination for tier-2 urban transit.",
                icon: "🛺",
                industry: "Mobility",
                geo: "India",
                segment: "Urban Transit Fleets"
            },
        ]
    },
    {
        category: "Retail, Logistics & Hyperlocal Supply Chain",
        ideas: [
            {
                title: "Dark Store Hyperlocal Demand Predictor",
                desc: "Predictive replenishment agent analyzing weather, regional holidays, and local search signals to eliminate stockouts in 10-minute grocery delivery.",
                icon: "📦",
                industry: "Supply Chain & AI",
                geo: "India",
                segment: "Quick Commerce Dark Stores"
            },
            {
                title: "Perishable Agri Cold-Chain Marketplace",
                desc: "IoT reefer truck aggregation and farm-gate cold room leasing platform cutting post-harvest fruit spoilage by 35%.",
                icon: "🚜",
                industry: "AgriTech & Logistics",
                geo: "India",
                segment: "Farmer Producer Orgs (FPOs)"
            },
            {
                title: "B2B Kirana Procurement & Credit Network",
                desc: "Aggregated FMCG bulk ordering for local convenience stores with embedded 14-day zero-interest supply chain credit.",
                icon: "🏪",
                industry: "Retail B2B",
                geo: "India",
                segment: "Mom-and-Pop Retailers"
            },
            {
                title: "Hyperlocal Intercity Courier Aggregator",
                desc: "Dynamic load-matching platform connecting empty cargo bays in state transport buses with same-day parcels.",
                icon: "🚌",
                industry: "Logistics",
                geo: "India",
                segment: "D2C Brands & Shippers"
            },
        ]
    }
];

export default function Ideas() {
    const { setAnalysisInput, setContextTags } = useStore();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const navigate = useNavigate();

    const handleIdeaClick = (idea) => {
        setAnalysisInput(`${idea.title}: ${idea.desc}`);
        setContextTags({
            industry: [idea.industry],
            geo: [idea.geo],
            segment: [idea.segment]
        });
        navigate('/');
    };

    const categories = ["All", ...IDEAS_DB.map(c => c.category)];

    const filteredSections = selectedCategory === "All"
        ? IDEAS_DB
        : IDEAS_DB.filter(c => c.category === selectedCategory);

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="flex flex-col items-center text-center mb-12 space-y-4 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-1">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Curated Hypotheses Library
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    Find your next <span className="gradient-text">high-conviction thesis.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Explore validated problem statements with pre-configured market filters. Click any card to launch an autonomous 11-agent market teardown immediately.
                </p>

                {/* Category Pill Filters */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4 max-w-3xl">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            aria-pressed={selectedCategory === cat}
                            aria-label={`Filter by category: ${cat}`}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                                selectedCategory === cat
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/40"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-14 pb-20">
                {filteredSections.map((catGroup, idx) => (
                    <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{catGroup.category}</h2>
                            <div className="h-px bg-slate-200 dark:bg-slate-700/60 flex-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {catGroup.ideas.map((idea, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleIdeaClick(idea)}
                                    aria-label={`Analyze hypothesis: ${idea.title}`}
                                    className="text-left group bg-card border border-border p-5 rounded-2xl hover:border-primary/30 shadow-sm hover:shadow-md transition-colors duration-150 flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-2xl bg-muted w-11 h-11 flex items-center justify-center rounded-xl" aria-hidden="true">
                                            {idea.icon}
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900 flex items-center gap-1">
                                            <Globe className="w-2.5 h-2.5" aria-hidden="true" /> {idea.geo}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                        {idea.title}
                                    </h3>
                                    
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1 font-medium leading-relaxed line-clamp-3">
                                        {idea.desc}
                                    </p>

                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between mt-auto">
                                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[130px]">
                                            {idea.industry}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            Analyze <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
