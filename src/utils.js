import axios from "axios";

const AIKEK_FUNC_ADDR = `PbILSASd47G00ijDlqBOZD7aZSH3ZS2eX7LvXnFEWTU`; 
// X8D-aO1yGRpB4aC3NzKmp2syAeBMjMsD_CinIxUEIsU
async function getState() {
  try {
    return (
      await axios.get(`https://api.mem.tech/api/state/${AIKEK_FUNC_ADDR}`)
    )?.data;
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function resolveDomain(domain) {
  try {
    const domains = (await getState())?.domains;
    const normalizedDomain = domain.normalize("NFKC");

    const resolved = domains.find((usr) => usr.domain == normalizedDomain);

    if (resolved) {
      return resolved;
    }

    return {};
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function resolveAddr(addr) {
  try {
    const domains = (await getState())?.domains;

    const resolved = domains.find(
      (usr) => usr.owner.toLowerCase() == addr.toLowerCase() && usr.is_primary,
    );

    if (resolved) {
      return resolved;
    }

    return {};
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function getAllDomains(addr) {
  try {
    const domains = (await getState())?.domains;

    const resolved = domains.filter(
      (usr) => usr.owner.toLowerCase() == addr.toLowerCase(),
    );

    if (resolved) {
      return resolved;
    }

    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
}
