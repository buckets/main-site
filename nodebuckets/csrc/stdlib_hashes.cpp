/* Generated by Nim Compiler v0.19.1 */
/*   (c) 2018 Andreas Rumpf */
/* The generated code is subject to the original license. */
#define NIM_NEW_MANGLING_RULES
#define NIM_INTBITS 64

#include "nimbase.h"
#undef LANGUAGE_C
#undef MIPSEB
#undef MIPSEL
#undef PPC
#undef R3000
#undef R4000
#undef i386
#undef linux
#undef mips
#undef near
#undef far
#undef powerpc
#undef unix
struct NimStringDesc;
struct TGenericSeq;
struct TGenericSeq {
NI len;
NI reserved;
};
typedef NIM_CHAR tyUncheckedArray_py3s8sMDoAoBkn8uuh0ZzQ[1];
struct NimStringDesc : public TGenericSeq {
tyUncheckedArray_py3s8sMDoAoBkn8uuh0ZzQ data;
};
static N_INLINE(NI, emarkamp__6dtCP6C39bxOkT4wrIPJwKghashes)(NI h, NI val);
static N_INLINE(NI, emarkdollar__zs9byUtT9cNi2e9clB27b2cUAhashes)(NI h);

static N_INLINE(NI, emarkamp__6dtCP6C39bxOkT4wrIPJwKghashes)(NI h, NI val) {
	NI result;
	result = (NI)0;
	result = (NI)((NU64)(h) + (NU64)(val));
	result = (NI)((NU64)(result) + (NU64)((NI)((NU64)(result) << (NU64)(((NI) 10)))));
	result = (NI)(result ^ (NI)((NU64)(result) >> (NU64)(((NI) 6))));
	return result;
}

static N_INLINE(NI, emarkdollar__zs9byUtT9cNi2e9clB27b2cUAhashes)(NI h) {
	NI result;
	result = (NI)0;
	result = (NI)((NU64)(h) + (NU64)((NI)((NU64)(h) << (NU64)(((NI) 3)))));
	result = (NI)(result ^ (NI)((NU64)(result) >> (NU64)(((NI) 11))));
	result = (NI)((NU64)(result) + (NU64)((NI)((NU64)(result) << (NU64)(((NI) 15)))));
	return result;
}

N_LIB_PRIVATE N_NIMCALL(NI, hash_uBstFm5SYVQeOL3j9c9bc58A)(NimStringDesc* x) {
	NI result;
	result = (NI)0;
	NI h = ((NI) 0);
	{
		NI i;
		NI colontmp_;
		i = (NI)0;
		colontmp_ = (NI)0;
		colontmp_ = (NI)((x ? x->len : 0) - ((NI) 1));
		NI res = ((NI) 0);
		{
			while (1) {
				if (!(res <= colontmp_)) goto LA3;
				i = res;
				h = emarkamp__6dtCP6C39bxOkT4wrIPJwKghashes(h, ((NU8)(x->data[i])));
				res += ((NI) 1);
			} LA3: ;
		}
	}
	result = emarkdollar__zs9byUtT9cNi2e9clB27b2cUAhashes(h);
	return result;
}
N_LIB_PRIVATE N_NIMCALL(void, stdlib_hashesInit000)(void) {
{
	TFrame FR_; FR_.len = 0;
}
}

N_LIB_PRIVATE N_NIMCALL(void, stdlib_hashesDatInit000)(void) {
}

