// js/dashboard.js
import { supabase } from './supabaseClient.js';

const profilContainer = document.getElementById('profilContainer');
const mesTfcContainer = document.getElementById('mesTfcContainer');
const logoutBtn = document.getElementById('logoutBtn');

// 1. Vérification de la session et chargement des données
async function chargerTableauDeBord() {
    // Récupérer la session active
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        alert("🔒 Session expirée ou non autorisée. Veuillez vous connecter.");
        window.location.href = 'index.html';
        return;
    }

    const userId = session.user.id;

    // 2. Charger les infos de l'étudiant (table 'etudiants')
    const { data: etudiant, error: etudiantError } = await supabase
        .from('etudiants')
        .select('*')
        .eq('id', userId)
        .single();

    if (etudiantError) {
        console.error("Erreur profil :", etudiantError);
        profilContainer.innerHTML = "<p style='color: red;'>Impossible de charger votre profil.</p>";
    } else {
        profilContainer.innerHTML = `
            <div class="card-profil">
                <p><strong>Nom complet :</strong> ${etudiant.prenom} ${etudiant.postnom || ''} ${etudiant.nom} (${etudiant.sexe})</p>
                <p><strong>Matricule :</strong> ${etudiant.matricule}</p>
                <p><strong>Faculté :</strong> ${etudiant.faculte} | <strong>Département :</strong> ${etudiant.departement}</p>
                <p><strong>Promotion :</strong> ${etudiant.promotion} | <strong>Email :</strong> ${etudiant.email}</p>
            </div>
        `;
    }

    // 3. Charger les TFC de l'étudiant connecté (table 'tfc')
    const { data: mesTfcs, error: tfcError } = await supabase
        .from('tfc')
        .select('*')
        .eq('etudiant_id', userId)
        .order('date_depot', { ascending: false });

    if (tfcError) {
        console.error("Erreur TFC :", tfcError);
        mesTfcsContainer.innerHTML = "<p style='color: red;'>Erreur lors du chargement de vos travaux.</p>";
        return;
    }

    if (mesTfcs.length === 0) {
        mesTfcsContainer.innerHTML = "<p>Vous n'avez pas encore déposé de TFC. <a href='depot.html'>Déposer votre premier TFC</a></p>";
        return;
    }

    // Affichage des TFC de l'étudiant
    mesTfcContainer.innerHTML = "";
    mesTfcs.forEach(tfc => {
        const statutBadge = tfc.statut === 'publie' ? '🟢 Publié' : '🟠 Masqué/Signalé';
        
        const card = document.createElement('div');
        card.className = 'tfc-card-perso';
        card.innerHTML = `
            <h3>${tfc.titre}</h3>
            <p><strong>Année :</strong> ${tfc.annee_academique} | <strong>Statut :</strong> ${statutBadge}</p>
            <p><strong>Vues :</strong> ${tfc.nombre_vues} | <strong>Déposé le :</strong> ${new Date(tfc.date_depot).toLocaleDateString()}</p>
            <div class="actions">
                <a href="${tfc.fichier_pdf_url}" target="_blank" class="btn-lire">Voir le PDF</a>
            </div>
        `;
        mesTfcContainer.appendChild(card);
    });
}

// 4. Gestion de la déconnexion
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Erreur déconnexion :", error);
    } else {
        window.location.href = 'index.html';
    }
});

// Lancement au chargement
chargerTableauDeBord();


