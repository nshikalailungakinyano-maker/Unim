// js/bibliotheque.js
import { supabase } from './supabaseClient.js';

const tfcContainer = document.getElementById('tfcContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const authLink = document.getElementById('authLink');

// 1. Vérifier si un utilisateur est connecté pour adapter le menu haut
async function verifierAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        authLink.textContent = "Mon Espace";
        authLink.href = "dashboard.html";
    }
}

// 2. Charger et afficher les TFC depuis Supabase
async function chargerTFC(recherche = '') {
    tfcContainer.innerHTML = "<p>Chargement...</p>";

    let query = supabase
        .from('tfc')
        .select(`
            *,
            etudiants (nom, prenom, faculte, promotion)
        `)
        .eq('statut', 'publie')
        .order('date_depot', { ascending: false });

    // Si l'utilisateur tape une recherche
    if (recherche) {
        query = query.or(`titre.ilike.%${recherche}%,mots_cles.ilike.%${recherche}%`);
    }

    const { data: tfcs, error } = await query;

    if (error) {
        console.error("Erreur chargement TFC :", error);
        tfcContainer.innerHTML = "<p style='color: red;'>Erreur lors du chargement des travaux.</p>";
        return;
    }

    if (tfcs.length === 0) {
        tfcContainer.innerHTML = "<p>Aucun TFC trouvé.</p>";
        return;
    }

    // Affichage des cartes TFC
    tfcContainer.innerHTML = "";
    tfcs.forEach(tfc => {
        const auteurNom = tfc.etudiants ? `${tfc.etudiants.prenom} ${tfc.etudiants.nom}` : "Auteur inconnu";
        const faculte = tfc.etudiants ? tfc.etudiants.faculté : "Faculté non spécifiée";

        const card = document.createElement('div');
        card.className = 'tfc-card';
        card.innerHTML = `
            <h3>${tfc.titre}</h3>
            <p><strong>Auteur :</strong> ${auteurNom}</p>
            <p><strong>Faculté :</strong> ${tfc.faculte || faculte} | <strong>Année :</strong> ${tfc.annee_academique}</p>
            <p class="resume">${tfc.resume.substring(0, 150)}...</p>
            <div class="tfc-actions">
                <a href="${tfc.fichier_pdf_url}" target="_blank" class="btn-lire">Lire / Télécharger PDF</a>
                <button class="btn-interagir" onclick="tenterInteraction()">❤️ (${tfc.nombre_vues} vues)</button>
            </div>
        `;
        tfcContainer.appendChild(card);
    });
}

// 3. Gestion du clic sur les boutons interactifs (Bloque les visiteurs)
window.tenterInteraction = async function() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("🔒 Action réservée aux étudiants. Veuillez vous connecter ou créer un compte pour aimer ou commenter ce TFC.");
        window.location.href = 'index.html';
    } else {
        alert("Action autorisée ! (Fonctionnalité J'aime/Commentaire en cours de liaison).");
    }
}

// Événement recherche
searchBtn.addEventListener('click', () => {
    chargerTFC(searchInput.value.trim());
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        chargerTFC(searchInput.value.trim());
    }
});

// Lancement au chargement de la page
verifierAuthHeader();
chargerTFC();
// Exemple de génération des cartes TFC dans ton script de bibliothèque
function afficherTfc(listeTfc) {
    const container = document.getElementById('tfcContainer'); // Remplace par l'ID de ton conteneur HTML
    if (!container) return;
    
    container.innerHTML = '';

    if (listeTfc.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Aucun TFC trouvé.</p>';
        return;
    }

    listeTfc.forEach(tfc => {
        const card = document.createElement('div');
        card.className = 'tfc-card';
        card.innerHTML = `
            <h3>${tfc.titre}</h3>
            <p class="resume">${tfc.resume || 'Aucun résumé disponible.'}</p>
            <p><strong>Faculté :</strong> ${tfc.faculte || 'N/A'} | <strong>Promotion :</strong> ${tfc.promotion || 'N/A'}</p>
            
            <div class="tfc-actions">
                <!-- Bouton pour lire en ligne via la modale -->
                <button type="button" class="btn-lire btn-ouvrir-modal" data-url="${tfc.fichier_pdf_url}" data-titre="${tfc.titre}">
                    📖 Lire en ligne
                </button>
                
                <!-- Bouton de téléchargement direct -->
                <a href="${tfc.fichier_pdf_url}" download class="btn-interagir" target="_blank" style="text-align: center; text-decoration: none; display: inline-block;">
                    📥 Télécharger
                </a>
            </div>
        `;
        container.appendChild(card);
    });

    // Activer les écouteurs sur les nouveaux boutons "Lire"
    activerModalLecture();
}

// Gestion de l'ouverture et de la fermeture de la modale PDF
function activerModalLecture() {
    const modal = document.getElementById('pdfModal');
    const pdfFrame = document.getElementById('pdfViewerFrame');
    const modalTitle = document.getElementById('modalTitle');
    const closeBtn = document.getElementById('closeModalBtn');

    document.querySelectorAll('.btn-ouvrir-modal').forEach(button => {
        button.addEventListener('click', () => {
            const pdfUrl = button.getAttribute('data-url');
            const titre = button.getAttribute('data-titre');

            if (!pdfUrl) {
                alert("Lien du fichier PDF introuvable.");
                return;
            }

            modalTitle.textContent = titre;
            pdfFrame.src = pdfUrl; // Charge le PDF dans l'iframe
            modal.style.display = 'flex'; // Affiche la modale
        });
    });

    // Fermeture au clic sur la croix
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            pdfFrame.src = ''; // Vide l'iframe pour stopper la lecture en arrière-plan
        };
    }

    // Fermeture si on clique en dehors de la boîte blanche
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            pdfFrame.src = '';
        }
    };
}




