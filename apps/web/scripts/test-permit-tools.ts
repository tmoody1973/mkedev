/**
 * Test script for permit tools
 *
 * Usage: pnpm test-permits
 */

import {
  searchPermitForms,
  searchDesignGuidelines,
  recommendPermitForms,
  recommendDesignGuidelines,
  getFormStats,
} from "../src/lib/permits";

console.log("🔧 Testing Permit Tools\n");

// Test stats
const stats = getFormStats();
console.log("📊 Permit Stats:");
console.log(`   Total Forms: ${stats.totalForms}`);
console.log(`   Total Guidelines: ${stats.totalGuidelines}`);
console.log(`   Project Types: ${stats.projectTypes.join(", ")}`);

// Test search
console.log("\n🔍 Search Test: 'home occupation'");
const homeOccResults = searchPermitForms("home occupation");
console.log(`   Found ${homeOccResults.length} forms`);
if (homeOccResults.length > 0) {
  console.log(`   Top result: ${homeOccResults[0].officialName}`);
}

// Test search guidelines
console.log("\n🔍 Search Guidelines: 'parking'");
const parkingResults = searchDesignGuidelines("parking");
console.log(`   Found ${parkingResults.length} guidelines`);
if (parkingResults.length > 0) {
  console.log(`   Top result: ${parkingResults[0].title}`);
}

// Test recommendation
console.log("\n📋 Recommendation Test: ADU Project");
const aduRec = recommendPermitForms({
  projectType: "adu",
  description: "Building an accessory dwelling unit in my backyard",
  isResidential: true,
});
console.log(`   Required: ${aduRec.required.length} forms`);
console.log(`   Recommended: ${aduRec.recommended.length} forms`);
console.log(`   Optional: ${aduRec.optional.length} forms`);
if (aduRec.required.length > 0) {
  console.log(`   Required forms: ${aduRec.required.map((f) => f.officialName).join(", ")}`);
}

// Test design guideline recommendation
console.log("\n🎨 Design Guideline Recommendation: Commercial with Parking");
const designRec = recommendDesignGuidelines({
  description: "New commercial building with surface parking lot",
  hasParking: true,
  isCommercial: true,
  keywords: ["parking", "retail", "facade"],
});
console.log(`   Found ${designRec.length} relevant guidelines`);
if (designRec.length > 0) {
  console.log(`   Top guidelines:`);
  designRec.slice(0, 3).forEach((g) => console.log(`     - ${g.title}`));
}

console.log("\n✅ All tests completed!");
